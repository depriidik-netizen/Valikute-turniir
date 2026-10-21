-- ==============================================================================
-- Valikute Turniir (DuoVote) - Supabase Database & Storage Setup
-- ==============================================================================
-- Instructions: Run this SQL script in your Supabase SQL Editor.
-- This script creates the required tables ('rooms', 'options', 'votes'),
-- configures the public Storage bucket ('tournament-images'),
-- and sets up public access Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. Enable necessary extensions
create extension if not exists "pgcrypto";

-- 2. Create 'rooms' table
create table if not exists public.rooms (
  id text primary key,                                  -- e.g. 'REIS-2026', 'VALIK-4X9B'
  title text not null,                                  -- Tournament title
  category text not null,                               -- e.g. 'Reisisihtkoht ja Puhkus'
  host_name text not null default 'Korraldaja',         -- Name of tournament creator
  host_key text not null,                               -- Secret token for host administration
  allow_voter_options boolean not null default true,   -- Whether participants can suggest choices
  max_votes_per_user integer not null default 15,       -- Maximum pairwise comparisons per user
  deadline timestamptz not null,                        -- Voting cut-off deadline
  total_votes integer not null default 0,               -- Total votes recorded across all pairs
  unique_voters_count integer not null default 0,       -- Approximate count of distinct participants
  pair_counts jsonb not null default '{}'::jsonb,       -- Pair exposure tracker: { "optA_optB": count }
  status text not null default 'active'                 -- 'active' | 'closed'
    check (status in ('active', 'closed')),
  created_at timestamptz not null default now()
);

-- 3. Create 'options' table
create table if not exists public.options (
  id text primary key,                                  -- e.g. 'opt-1', 'opt-1729000-0'
  room_id text not null references public.rooms(id) on delete cascade,
  title text not null,                                  -- Option title
  description text default '',                          -- Short descriptive text
  image_url text default '',                            -- Public URL of image (Supabase storage or web)
  score integer not null default 1200,                  -- Elo rating score (starts at 1200)
  matches integer not null default 0,                   -- Total 1v1 matches played
  wins integer not null default 0,                      -- Total wins in duels
  losses integer not null default 0,                    -- Total losses in duels
  ties integer not null default 0,                      -- Total ties/draws
  added_by text not null default 'host'                 -- 'host' | 'voter'
    check (added_by in ('host', 'voter')),
  added_by_name text default null,                      -- Name of author (for voter suggestions)
  created_at timestamptz not null default now()
);

-- 4. Create 'votes' table for auditing and pairwise voting history
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  winner_id text not null references public.options(id) on delete cascade,
  loser_id text not null references public.options(id) on delete cascade,
  is_tie boolean not null default false,
  voter_identifier text default null,                   -- Optional anonymous session or IP hash
  created_at timestamptz not null default now()
);

-- 5. Performance Indexes
create index if not exists idx_options_room_id on public.options(room_id);
create index if not exists idx_options_score on public.options(room_id, score desc);
create index if not exists idx_votes_room_id on public.votes(room_id);
create index if not exists idx_rooms_created_at on public.rooms(created_at desc);

-- 6. Enable Row Level Security (RLS)
alter table public.rooms enable row level security;
alter table public.options enable row level security;
alter table public.votes enable row level security;

-- 7. RLS Policies: Allow public (anon & authenticated) full voting and room participation
-- Since the application operates via room codes and host keys without mandatory user accounts:

-- Rooms policies
drop policy if exists "Public rooms can be viewed by anyone" on public.rooms;
create policy "Public rooms can be viewed by anyone"
  on public.rooms for select
  using (true);

drop policy if exists "Anyone can create a room" on public.rooms;
create policy "Anyone can create a room"
  on public.rooms for insert
  with check (true);

drop policy if exists "Anyone can update room stats" on public.rooms;
create policy "Anyone can update room stats"
  on public.rooms for update
  using (true);

-- Options policies
drop policy if exists "Public options can be viewed by anyone" on public.options;
create policy "Public options can be viewed by anyone"
  on public.options for select
  using (true);

drop policy if exists "Anyone can add options to room" on public.options;
create policy "Anyone can add options to room"
  on public.options for insert
  with check (true);

drop policy if exists "Anyone can update option scores from votes" on public.options;
create policy "Anyone can update option scores from votes"
  on public.options for update
  using (true);

-- Votes policies
drop policy if exists "Public votes can be viewed by anyone" on public.votes;
create policy "Public votes can be viewed by anyone"
  on public.votes for select
  using (true);

drop policy if exists "Anyone can cast a vote" on public.votes;
create policy "Anyone can cast a vote"
  on public.votes for insert
  with check (true);

-- ==============================================================================
-- 8. Supabase Storage Bucket: tournament-images
-- ==============================================================================
-- Create the public storage bucket for uploaded tournament images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tournament-images',
  'tournament-images',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Storage RLS policies for tournament-images bucket
drop policy if exists "Public read tournament images" on storage.objects;
create policy "Public read tournament images"
  on storage.objects for select
  using (bucket_id = 'tournament-images');

drop policy if exists "Public upload tournament images" on storage.objects;
create policy "Public upload tournament images"
  on storage.objects for insert
  with check (bucket_id = 'tournament-images');

drop policy if exists "Public update tournament images" on storage.objects;
create policy "Public update tournament images"
  on storage.objects for update
  using (bucket_id = 'tournament-images');

drop policy if exists "Public delete tournament images" on storage.objects;
create policy "Public delete tournament images"
  on storage.objects for delete
  using (bucket_id = 'tournament-images');

-- ==============================================================================
-- 9. Seed Sample Room 'REIS-2026' (Optional default demo room)
-- ==============================================================================
insert into public.rooms (
  id, title, category, host_name, host_key, allow_voter_options, max_votes_per_user,
  deadline, total_votes, unique_voters_count, status
) values (
  'REIS-2026',
  'Tiimi Suvereisi Sihtkoht',
  'Reisisihtkoht ja Puhkus',
  'Markus',
  'demo-host-key-12345',
  true,
  15,
  now() + interval '3 days',
  14,
  3,
  'active'
) on conflict (id) do nothing;

insert into public.options (
  id, room_id, title, description, image_url, score, matches, wins, losses, ties, added_by, added_by_name
) values
  ('opt-1', 'REIS-2026', 'Rooma, Itaalia', 'Ajaloolised monumendid, Colosseum ja imeline Itaalia köök', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80', 1264, 7, 5, 2, 0, 'host', null),
  ('opt-2', 'REIS-2026', 'Barcelona, Hispaania', 'Vahemere rand, Gaudi meistriteosed ja vabaõhu tapas-baarid', 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&auto=format&fit=crop&q=80', 1248, 6, 4, 2, 0, 'host', null),
  ('opt-3', 'REIS-2026', 'Praha, Tšehhi', 'Muinasjutuline vanalinn, Karli sild ja hubane atmosfäär', 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&auto=format&fit=crop&q=80', 1192, 5, 2, 3, 0, 'host', null),
  ('opt-4', 'REIS-2026', 'Lissabon, Portugal', 'Päikeselised terrassid, trammiromantika ja ookeanikallas', 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&auto=format&fit=crop&q=80', 1180, 5, 2, 3, 0, 'voter', 'Liis'),
  ('opt-5', 'REIS-2026', 'Islandi Ringreis', 'Müstilised kosed, virmalised ja kuumaveeallikad', 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&auto=format&fit=crop&q=80', 1216, 5, 3, 2, 0, 'voter', 'Joonas')
on conflict (id) do nothing;
