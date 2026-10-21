import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function isSupabaseConfigured() {
  return supabase !== null;
}

export async function checkSupabaseHealth() {
  if (!supabase) return { configured: false, error: 'Supabase võtmed puuduvad .env failist' };
  try {
    const { error } = await supabase.from('rooms').select('id').limit(1);
    if (error) throw error;
    return { configured: true, status: 'ok' };
  } catch (err: any) {
    return { configured: true, status: 'error', error: err.message };
  }
}

export async function getRoom(roomId: string) {
  if (!supabase) throw new Error('Andmebaasi ühendus puudub. Kas .env fail on õige?');
  
  const { data: room, error: roomError } = await supabase.from('rooms').select('*').eq('id', roomId).single();
  if (roomError || !room) return null;

  const { data: options, error: optError } = await supabase.from('options').select('*').eq('room_id', roomId);
  if (optError) throw optError;

  return {
    id: room.id,
    title: room.title,
    category: room.category,
    hostName: room.host_name,
    hostKey: room.host_key,
    allowVoterOptions: room.allow_voter_options,
    maxVotesPerUser: room.max_votes_per_user,
    deadline: room.deadline,
    totalVotes: room.total_votes,
    uniqueVotersCount: room.unique_voters_count,
    pairCounts: room.pair_counts || {},
    status: room.status,
    createdAt: room.created_at,
    options: options.map(o => ({
      id: o.id,
      title: o.title,
      description: o.description,
      imageUrl: o.image_url,
      score: o.score,
      matches: o.matches,
      wins: o.wins,
      losses: o.losses,
      ties: o.ties,
      addedBy: o.added_by,
      addedByName: o.added_by_name,
      createdAt: o.created_at
    }))
  };
}

export async function createRoom(roomData: any) {
  if (!supabase) throw new Error('Andmebaasi ühendus puudub');
  const { options, ...rest } = roomData;

  const { error: roomError } = await supabase.from('rooms').insert([{
    id: rest.id,
    title: rest.title,
    category: rest.category,
    host_name: rest.hostName,
    host_key: rest.hostKey,
    allow_voter_options: rest.allowVoterOptions,
    max_votes_per_user: rest.maxVotesPerUser,
    deadline: rest.deadline,
    created_at: Date.now()
  }]);
  if (roomError) throw roomError;

  const dbOptions = options.map((opt: any) => ({
    id: opt.id || String(Date.now() + Math.random()),
    room_id: rest.id,
    title: opt.title,
    description: opt.description,
    image_url: opt.imageUrl,
    added_by: 'host',
    added_by_name: rest.hostName,
    created_at: Date.now()
  }));

  const { error: optError } = await supabase.from('options').insert(dbOptions);
  if (optError) throw optError;

  return await getRoom(rest.id);
}

export async function submitVote(roomId: string, winnerId: string, loserId: string, isTie: boolean, voterId: string) {
  if (!supabase) throw new Error('Andmebaasi ühendus puudub');

  await supabase.from('votes').insert([{
    room_id: roomId,
    voter_id: voterId,
    winner_id: winnerId,
    loser_id: loserId,
    is_tie: isTie
  }]);

  const { data: options } = await supabase.from('options').select('*').eq('room_id', roomId);
  if (options) {
    const optA = options.find(o => o.id === winnerId);
    const optB = options.find(o => o.id === loserId);

    if (optA && optB) {
      const expectedA = 1 / (1 + Math.pow(10, (optB.score - optA.score) / 400));
      const expectedB = 1 - expectedA;
      const scoreA = isTie ? 0.5 : 1;
      const scoreB = 1 - scoreA;
      
      const kFactor = 32;
      const deltaA = Math.round(kFactor * (scoreA - expectedA));
      const deltaB = Math.round(kFactor * (scoreB - expectedB));

      await supabase.from('options').update({
        score: optA.score + deltaA,
        matches: optA.matches + 1,
        wins: optA.wins + (isTie ? 0 : 1),
        ties: optA.ties + (isTie ? 1 : 0)
      }).eq('id', winnerId);

      await supabase.from('options').update({
        score: optB.score + deltaB,
        matches: optB.matches + 1,
        losses: optB.losses + (isTie ? 0 : 1),
        ties: optB.ties + (isTie ? 1 : 0)
      }).eq('id', loserId);
    }
  }

  const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('room_id', roomId);
  if (count !== null) {
    await supabase.from('rooms').update({ total_votes: count }).eq('id', roomId);
  }

  return await getRoom(roomId);
}

export async function addOptionToRoom(roomId: string, optionData: any) {
  if (!supabase) throw new Error('Andmebaasi ühendus puudub');
  const newOption = {
    id: String(Date.now()),
    room_id: roomId,
    title: optionData.title,
    description: optionData.description,
    image_url: optionData.imageUrl,
    added_by: optionData.addedBy,
    added_by_name: optionData.addedByName,
    created_at: Date.now()
  };
  const { error } = await supabase.from('options').insert([newOption]);
  if (error) throw error;
  return await getRoom(roomId);
}

export async function updateRoomSettings(roomId: string, hostKey: string, settings: any) {
  if (!supabase) throw new Error('Andmebaasi ühendus puudub');
  const { error } = await supabase.from('rooms')
    .update({
      deadline: settings.deadline,
      allow_voter_options: settings.allowVoterOptions,
      max_votes_per_user: settings.maxVotesPerUser,
      status: settings.status
    })
    .eq('id', roomId)
    .eq('host_key', hostKey);
  if (error) throw error;
  return await getRoom(roomId);
}

export async function uploadToTournamentStorage(base64Image: string, prefix: string) {
  if (!supabase) return base64Image;
  try {
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Image;

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const extension = mimeType.split('/')[1] || 'png';
    const fileName = `${prefix}_${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from('tournament-images')
      .upload(fileName, buffer, { contentType: mimeType });

    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from('tournament-images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  } catch (e) {
    console.error('Pildi laadimine ebaõnnestus:', e);
    return base64Image;
  }
}
