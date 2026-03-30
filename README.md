# ClipForge

Self-hosted video rendering engine. Replaces HeyGen, Shotstack, CapCut API, and any paid video composition tool.

## Architecture

- **Web** (`apps/web`) — Next.js 14 App Router. Dashboard UI + REST API.
- **Worker** (`apps/worker`) — Node.js job processor. Polls Supabase for queued jobs, renders with FFmpeg/Sharp, uploads to R2.
- **Shared** (`packages/shared`) — TypeScript types and Zod schemas shared across apps.

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 20, pnpm workspaces, Turborepo |
| Web | Next.js 14, TypeScript, Tailwind CSS |
| Worker | Node.js + TypeScript, tsup, FFmpeg, Sharp |
| Database | Supabase (Postgres) |
| Storage | Cloudflare R2 (S3-compatible) |
| Deploy | Railway (2 services from one repo) |

## Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project named `clipforge`
2. Open the SQL Editor and run the contents of `supabase/migrations/001_initial.sql`
3. Copy your project URL, anon key, and service role key

### Step 2: Create Railway Project

1. Create a new Railway project called `clipforge`
2. Connect your GitHub repo

**Service 1: clipforge-web**
- Root directory: `apps/web`
- Build command: `cd ../.. && pnpm install && pnpm --filter web build`
- Start command: `pnpm --filter web start`
- Port: `3000`

**Service 2: clipforge-worker**
- Root directory: `apps/worker`
- Dockerfile path: `apps/worker/Dockerfile`
- No port needed
- Replicas: 2 (recommended)

### Step 3: Set Environment Variables

Set all variables from `.env.example` at the Railway **project level** (shared across services).

Generate your API key:
```bash
openssl rand -hex 32
```

## API Reference

All endpoints require the `X-ClipForge-Key` header (except `/api/health`).

### POST /api/jobs

Create a render job.

```bash
curl -X POST https://your-app.up.railway.app/api/jobs \
  -H "Content-Type: application/json" \
  -H "X-ClipForge-Key: YOUR_API_KEY" \
  -d '{
    "type": "text_overlay",
    "payload": {
      "video_url": "https://example.com/video.mp4",
      "segments": [
        { "text": "HELLO WORLD", "size": 72, "style": "primary", "delay": 0, "duration": 3, "position": "center" }
      ],
      "primary_color": "#ffffff",
      "accent_color": "#c8b88a",
      "overlay_opacity": 0.4,
      "font": "bebas",
      "output_format": "mp4",
      "resolution": "1080x1920"
    }
  }'
```

**Response** (201):
```json
{ "id": "uuid", "status": "queued", "created_at": "2024-01-01T00:00:00Z" }
```

### GET /api/jobs/:id

Get job status and output.

```json
{
  "id": "uuid",
  "type": "text_overlay",
  "status": "complete",
  "progress": 100,
  "output_url": "https://cdn.yourdomain.com/renders/uuid/output.mp4",
  "error": null,
  "created_at": "...",
  "completed_at": "..."
}
```

### GET /api/jobs?limit=50

List recent jobs (max 200).

### GET /api/health

No auth required. Returns `{ "status": "ok", "timestamp": "..." }`.

## Job Types

| Type | Description | Output |
|------|-------------|--------|
| `text_overlay` | Animated text overlays on video | MP4 |
| `caption_burn` | Burn SRT captions into video | MP4 |
| `audio_dub` | Replace or mix audio track | MP4 |
| `trim` | Trim video to start/end timestamps | MP4 |
| `concat` | Concatenate multiple clips with optional fade | MP4 |
| `ad_creative` | Generate static ad image from template | PNG |

## Webhook Support

Add `webhook_url` to any job creation request. On completion, ClipForge POSTs:

```json
{
  "id": "uuid",
  "status": "complete",
  "output_url": "https://cdn.yourdomain.com/renders/uuid/output.mp4",
  "metadata": {}
}
```

## Local Development

```bash
pnpm install
pnpm dev
```

Requires FFmpeg installed locally for the worker.
