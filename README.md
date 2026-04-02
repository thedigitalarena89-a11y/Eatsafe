# Smart Food Weight Tracker

## Architecture (High Level)
- **Client (PWA)**: React + Vite with routes for Splash, Onboarding, Auth, Home, Scan, Result, Data.
- **Server (API)**: Node + Express for image upload and AI inference orchestration.
- **AI**: NVIDIA NIM endpoints for OCR and food detection (configurable by env).
- **Data/Auth/Storage**: Supabase Auth + Postgres + Storage.
- **Notifications**: Browser notifications with Supabase-backed reminders.

## Project Structure
- `client/` React + Vite PWA
- `server/` Express API

## Local Setup
### Client
1. `cd client`
2. `npm install`
3. `npm run dev`

### Server
1. `cd server`
2. `npm install`
3. `cp .env.example .env` and update variables
4. `npm run dev`

## Environment Variables
### Client
- `VITE_API_BASE_URL` - backend base URL
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

### Server
- `NIM_API_KEY` - NVIDIA API key (if required by your deployment)
- `NIM_API_BASE` - NVIDIA chat completions endpoint
- `NIM_VISION_MODEL` - Model name for vision
- `OCR_CROP` - optional crop in percent: `x,y,w,h`

## Supabase Setup
### 1) Create storage bucket
- Bucket name: `food-images`
- Public: enabled

### 2) Create table
```sql
create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  food_name text not null,
  weight_display text not null,
  weight_grams integer,
  image_url text,
  created_at timestamptz default now()
);

alter table food_logs enable row level security;

create policy "Users can insert their logs" on food_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can read their logs" on food_logs
  for select using (auth.uid() = user_id);

create policy "Users can update their logs" on food_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their logs" on food_logs
  for delete using (auth.uid() = user_id);
```

### 3) Reminders table
```sql
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text check (type in ('daily','custom')) not null,
  enabled boolean default false,
  daily_time text,
  custom_datetime timestamptz,
  message text,
  food_names text[],
  created_at timestamptz default now(),
  unique (user_id, type)
);

alter table reminders enable row level security;

create policy "Users can manage their reminders" on reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 4) Migration for existing reminders
```sql
alter table reminders
  add column if not exists food_names text[];

alter table reminders
  drop column if exists food_name;
```

## PWA
- Manifest: `client/public/manifest.json`
- Service Worker: `client/public/sw.js`

## Deployment Steps (Outline)
1. Deploy `server/` to a Node host (Render, Fly.io, AWS, GCP).
2. Set environment variables for NIM endpoints and API key.
3. Deploy `client/` to a static host (Netlify, Vercel) and set `VITE_API_BASE_URL`.
4. Ensure HTTPS for camera and service worker support.

## Notes
- OCR expects a NIM endpoint that accepts `POST /v1/chat/completions` with image input.
- Add icon files at `client/public/icons/icon-192.png` and `client/public/icons/icon-512.png`.
