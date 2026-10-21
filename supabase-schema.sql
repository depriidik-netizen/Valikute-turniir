-- ==============================================================================
-- Valikute Turniir (DuoVote) - Supabase Database & Storage Setup
-- ==============================================================================
-- Copy-paste this SQL script directly into your Supabase SQL Editor.
-- It creates tables ('rooms', 'options', 'votes'), the public Storage bucket
-- ('tournament-images'), and public access Row Level Security (RLS) policies.
-- ==============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.rooms (
  id text primary key,
  title text not null,
  category text not null,
  host_name text not null default 'Korraldaja',
  host_key text not null,
  allow_voter_options boolean not null default true,
  max_votes_per_user integer not null default 15,
  deadline timestamptz not null,
  total_votes integer not null default 0,
  unique_voters_count integer not null default 0,
  pair_counts jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.options (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  title text not null,
  description text default '',
  image_url text default '',
  score integer not null default 1200,
  matches integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  ties integer not null default 0,
  added_by text not null default 'host' check (added_by in ('host', 'voter')),
  added_by_name text default null,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  winner_id text not null references public.options(id) on delete cascade,
  loser_id text not null references public.options(id) on delete cascade,
  is_tie boolean not null default false,
  voter_identifier text default null,
  created_at timestamptz not null default now()
);

create index if not exists idx_options_room_id on public.options(room_id);
create index if not exists idx_options_score on public.options(room_id, score desc);
create index if not exists idx_votes_room_id on public.votes(room_id);
create index if not exists idx_rooms_created_at on public.rooms(created_at desc);

alter table public.rooms enable row level security;
alter table public.options enable row level security;
alter table public.votes enable row level security;

drop policy if exists "Public rooms can be viewed by anyone" on public.rooms;
create policy "Public rooms can be viewed by anyone" on public.rooms for select using (true);

drop policy if exists "Anyone can create a room" on public.rooms;
create policy "Anyone can create a room" on public.rooms for insert with check (true);

drop policy if exists "Anyone can update room stats" on public.rooms;
create policy "Anyone can update room stats" on public.rooms for update using (true);

drop policy if exists "Public options can be viewed by anyone" on public.options;
create policy "Public options can be viewed by anyone" on public.options for select using (true);

drop policy if exists "Anyone can add options to room" on public.options;
create policy "Anyone can add options to room" on public.options for insert with check (true);

drop policy if exists "Anyone can update option scores from votes" on public.options;
create policy "Anyone can update option scores from votes" on public.options for update using (true);

drop policy if exists "Public votes can be viewed by anyone" on public.votes;
create policy "Public votes can be viewed by anyone" on public.votes for select using (true);

drop policy if exists "Anyone can cast a vote" on public.votes;
create policy "Anyone can cast a vote" on public.votes for insert with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tournament-images',
  'tournament-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

drop policy if exists "Public read tournament images" on storage.objects;
create policy "Public read tournament images" on storage.objects for select using (bucket_id = 'tournament-images');

drop policy if exists "Public upload tournament images" on storage.objects;
create policy "Public upload tournament images" on storage.objects for insert with check (bucket_id = 'tournament-images');

drop policy if exists "Public update tournament images" on storage.objects;
create policy "Public update tournament images" on storage.objects for update using (bucket_id = 'tournament-images');

drop policy if exists "Public delete tournament images" on storage.objects;
create policy "Public delete tournament images" on storage.objects for delete using (bucket_id = 'tournament-images');
