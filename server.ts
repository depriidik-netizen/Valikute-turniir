/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getRoom,
  createRoom,
  submitVote,
  addOptionToRoom,
  updateRoomSettings,
  uploadToTournamentStorage,
  isSupabaseConfigured,
  checkSupabaseHealth,
} from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Supabase health/status endpoint for debugging and verification
app.get('/api/db-status', async (_req: Request, res: Response) => {
  const health = await checkSupabaseHealth();
  res.json({
    ...health,
    storageBucket: 'tournament-images',
  });
});

// Image direct upload endpoint to Supabase Storage
app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { image, prefix } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Pildi andmed on puudu' });
    }
    const publicUrl = await uploadToTournamentStorage(image, prefix || 'tournament');
    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Üleslaadimine ebaõnnestus' });
  }
});

// API Routes
app.get('/api/rooms/:id', async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id.toUpperCase();
    const room = await getRoom(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Tuba ei leitud' });
    }
    res.json(room);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Viga toa laadimisel' });
  }
});

app.post('/api/rooms', async (req: Request, res: Response) => {
  try {
    const { title, category, hostName, allowVoterOptions, deadline, options, maxVotesPerUser } = req.body;

    if (!title || !category || !deadline) {
      return res.status(400).json({ error: 'Pealkiri, kategooria ja tähtaeg on kohustuslikud' });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Vähemalt 2 valikut on nõutud turniiri alustamiseks' });
    }

    // Generate readable code: 4-6 chars
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const roomId = `VALIK-${code}`;
    const hostKey = `host-${Math.random().toString(36).substring(2, 10)}`;

    const parsedMaxVotes = typeof maxVotesPerUser === 'number' && maxVotesPerUser > 0 ? Math.round(maxVotesPerUser) : 15;

    const newRoom = await createRoom({
      id: roomId,
      title: title.trim(),
      category: category.trim(),
      hostName: (hostName || 'Korraldaja').trim(),
      hostKey,
      allowVoterOptions: Boolean(allowVoterOptions),
      maxVotesPerUser: parsedMaxVotes,
      deadline,
      options,
    });

    res.status(201).json(newRoom);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Serveri viga toa loomisel' });
  }
});

// Submit pairwise vote
app.post('/api/rooms/:id/vote', async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id.toUpperCase();
    const { winnerId, loserId, isTie, voterIdentifier } = req.body;

    if (!winnerId || !loserId) {
      return res.status(400).json({ error: 'winnerId ja loserId on kohustuslikud' });
    }

    const updatedRoom = await submitVote(roomId, winnerId, loserId, Boolean(isTie), voterIdentifier);
    res.json({ success: true, room: updatedRoom });
  } catch (err: any) {
    const status = err.message.includes('lõppenud') ? 403 : err.message.includes('ei leitud') ? 404 : 500;
    res.status(status).json({ error: err.message || 'Viga hääle salvestamisel' });
  }
});

// Add option to existing room
app.post('/api/rooms/:id/options', async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id.toUpperCase();
    const { title, description, imageUrl, addedBy, addedByName, hostKey } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Valiku pealkiri on nõutud' });
    }

    const result = await addOptionToRoom(roomId, {
      title,
      description,
      imageUrl,
      addedBy: addedBy === 'voter' ? 'voter' : 'host',
      addedByName,
      hostKey,
    });

    res.status(201).json({ success: true, option: result.option, room: result.room });
  } catch (err: any) {
    const status = err.message.includes('suletud') || err.message.includes('lubanud') ? 403 : err.message.includes('ei leitud') ? 404 : 500;
    res.status(status).json({ error: err.message || 'Valiku lisamine ebaõnnestus' });
  }
});

// Update room settings (host only)
app.patch('/api/rooms/:id', async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id.toUpperCase();
    const { hostKey, deadline, allowVoterOptions, status, maxVotesPerUser } = req.body;

    if (!hostKey) {
      return res.status(403).json({ error: 'Ainult ruumi korraldaja saab seadeid muuta' });
    }

    const updatedRoom = await updateRoomSettings(roomId, hostKey, {
      deadline,
      allowVoterOptions,
      maxVotesPerUser,
      status,
    });

    res.json({ success: true, room: updatedRoom });
  } catch (err: any) {
    const status = err.message.includes('korraldaja') ? 403 : err.message.includes('ei leitud') ? 404 : 500;
    res.status(status).json({ error: err.message || 'Seadete muutmine ebaõnnestus' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isSupabaseConfigured()) {
    console.log('[Database] Connected to Supabase PostgreSQL & Storage successfully');
  } else {
    console.log('[Database] Running with in-memory database fallback (Set SUPABASE_URL & SUPABASE_ANON_KEY to connect Supabase)');
  }

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
