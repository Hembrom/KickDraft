# SquadBalance

Fair football team generator for casual matches. React frontend + Vercel serverless API, backed by **Vercel Blob** storage.

## Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, React Router
- **Backend:** Vercel Serverless Functions (`/api`)
- **Storage:** Vercel Blob (JSON + images)
- **Auth:** Static admin password (server-verified token)

## Features

- Admin: create groups, add/edit/delete players with photos and 6 attributes
- Public group pages: select available players, auto/manual match format, generate balanced teams
- OVR auto-calculated as average of all stats
- Match history (last 30 days, purged daily via Vercel Cron)
- Mobile-first football-themed UI

## Quick start

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env.local` and set:

```bash
ADMIN_PASSWORD=your-admin-password
ADMIN_SECRET=your-random-secret
BLOB_READ_WRITE_TOKEN=   # from Vercel Blob store
```

### 3. Local development

**Frontend only (Vite):**

```bash
npm run dev
```

**Full stack (API + Blob):**

```bash
npx vercel dev
```

Use `vercel dev` for API routes and Blob access. Vite alone proxies `/api` to port 3000 when the full stack is running.

### 4. Deploy to Vercel

1. Push to GitHub and import project in Vercel
2. Create a **Blob store** in the Vercel dashboard (Storage → Blob)
3. Set env vars: `ADMIN_PASSWORD`, `ADMIN_SECRET`, optional `CRON_SECRET`
4. Deploy — cron job purges matches older than 30 days daily

## Routes

| URL | Description |
|-----|-------------|
| `/` | Home + squad list |
| `/{groupSlug}` | Select players & generate teams |
| `/{groupSlug}/history` | Match history |
| `/admin` | Admin login |
| `/admin/dashboard` | Manage groups |
| `/admin/groups/{slug}` | Manage players |

## Blob layout

```
groups/index.json
groups/{slug}/meta.json
groups/{slug}/players.json
groups/{slug}/images/{playerId}.jpg
groups/{slug}/matches/{matchId}.json
```

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
