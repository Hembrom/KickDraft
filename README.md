# SquadBalance

Fair football team generator for casual matches. React frontend + Vercel serverless API, backed by **Supabase** (Postgres + Storage).

## Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, React Router
- **Backend:** Vercel Serverless Functions (`/api`)
- **Storage:** Supabase Postgres (groups, players, matches) + Supabase Storage (player photos)
- **Auth:** Static admin password (server-verified token)

## Features

- Admin: create groups, add/edit/delete players with photos and 6 attributes
- Public group pages: full squad list, match format, generate balanced teams
- OVR auto-calculated as average of all stats
- Match history (last 30 days, purged daily via Vercel Cron)
- Mobile-first football-themed UI

## Quick start

### 1. Install

```bash
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql)
3. In **Storage**, confirm the `player-images` bucket exists (private)
4. Copy **Project URL** and **service_role** key from **Settings → API**

### 3. Environment

Copy `.env.example` to `.env.local`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-admin-password
ADMIN_SECRET=your-random-secret
```

Without Supabase env vars, the API falls back to local `.local-data/` files for development.

### 4. Local development

```bash
npm run dev
```

Runs Vite (frontend) and the API on port 3000.

### 5. Deploy to Vercel

1. Push to GitHub and import project in Vercel
2. Set env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, optional `CRON_SECRET`
3. Deploy — cron job purges matches older than 30 days daily

You can remove the Vercel Blob store; it is no longer used.

## Routes

| URL | Description |
|-----|-------------|
| `/` | Home + squad list |
| `/{groupSlug}` | Squad & generate teams |
| `/{groupSlug}/history` | Match history |
| `/admin` | Admin login |
| `/admin/dashboard` | Manage groups |
| `/admin/groups/{slug}` | Manage players |

## Database

| Table | Purpose |
|-------|---------|
| `groups` | Group slug, name, created date |
| `players` | Player profile, stats, photo URL |
| `matches` | Generated teams and match metadata |

Player photos are stored in the Supabase Storage bucket `player-images` at `{groupSlug}/{playerId}.{ext}`.

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/groups` | — | List groups |
| GET | `/api/groups/:slug` | — | Group + players |
| GET/POST | `/api/groups/:slug/matches` | — | History / generate |
| POST | `/api/admin/login` | — | Admin login |
| GET/POST | `/api/admin/groups` | Admin | List / create groups |
| GET/POST/PUT/DELETE | `/api/admin/groups/:slug/players` | Admin | Player CRUD |
| POST | `/api/admin/groups/:slug/upload` | Admin | Upload player photo |

## Team balancing

Players are sorted by OVR, grouped into rating tiers, shuffled within tiers, then assigned via snake draft to Team A and Team B for minimal rating difference with slight randomness.
