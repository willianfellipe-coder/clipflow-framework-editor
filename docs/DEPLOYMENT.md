# ClipFlow Deployment Guide

> **Author:** Willian Santos &nbsp;|&nbsp; **Project:** [ClipFlow Framework](https://github.com/willianfellipe-coder/clipflow-framework-editor) &nbsp;|&nbsp; **License:** MIT

This guide covers everything needed to deploy ClipFlow in a production environment.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Environment Variables](#3-environment-variables)
4. [WhisperX Setup](#4-whisperx-setup)
5. [Production Build](#5-production-build)
6. [System Check](#6-system-check)
7. [Health Monitoring](#7-health-monitoring)
8. [Data Storage](#8-data-storage)
9. [Security Notes](#9-security-notes)
10. [MCP Setup](#10-mcp-setup)

---

## 1. Prerequisites

Ensure the following are installed on your server before proceeding:

| Dependency | Minimum Version | Purpose |
|------------|----------------|---------|
| Node.js | 22+ | Server runtime and build toolchain |
| Python | 3.10+ | WhisperX transcription sidecar |
| FFmpeg | 6+ | Audio extraction, video processing, metadata |
| pnpm | 9+ | Package management for the monorepo |
| Google Chrome / Chromium | Latest | Remotion uses headless Chromium for rendering |

### Verify prerequisites

```bash
node -v          # Should print v22.x.x or higher
python3 --version # Should print 3.10.x or higher
ffmpeg -version   # Should print 6.x or higher
pnpm --version    # Should print 9.x or higher
```

For Chromium, ensure one of these paths exists (or install Chrome/Chromium):

- macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Linux: `/usr/bin/google-chrome` or `/usr/bin/chromium-browser`

---

## 2. Installation

```bash
# Clone the repository
git clone https://github.com/willianfellipe-coder/clipflow-framework-editor.git
cd clipflow-framework-editor

# Install all dependencies (monorepo-wide)
pnpm install

# Create your environment file
cp .env.example .env
```

Edit `.env` and fill in the required values (see next section).

---

## 3. Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for AI features) | -- | Your Anthropic API key for Claude. AI analysis and ClipGen will not work without it. |
| `HF_TOKEN` | No | -- | HuggingFace token. Enables speaker diarization in WhisperX. |
| `PORT` | No | `4400` | Port for the Fastify API server. |
| `APP_PORT` | No | `4401` | Port for the Vite frontend dev server (development only). |
| `DATABASE_URL` | No | `data/db/clipflow.db` | Path to the SQLite database file. The default is relative to the project root. |
| `NODE_ENV` | No | `development` | Set to `production` for production deployments. Disables auto-open browser and enables production optimizations. |

Example `.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
PORT=4400
APP_PORT=4401
NODE_ENV=production
```

If `ANTHROPIC_API_KEY` is not set, the server will start but print a warning, and all AI features (analysis, ClipGen) will return errors.

If `HF_TOKEN` is not set, transcription still works but speaker diarization is disabled.

---

## 4. WhisperX Setup

WhisperX runs as a Python sidecar. You can set it up automatically or manually.

### Automatic setup

```bash
bash scripts/setup.sh
```

This script:
1. Verifies Node.js, Python, FFmpeg, and pnpm are installed.
2. Installs Node.js dependencies via `pnpm install`.
3. Creates a Python virtual environment in `whisper/.venv`.
4. Installs WhisperX and its dependencies from `whisper/requirements.txt`.
5. Creates the `data/` directory structure.
6. Copies `.env.example` to `.env` if it does not already exist.

### Manual setup

```bash
cd whisper
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ..
```

### Verify WhisperX

```bash
whisper/.venv/bin/python -c "import whisperx; print('WhisperX OK')"
```

---

## 5. Production Build

Build all packages (shared types, server, frontend, Remotion compositions):

```bash
pnpm build
```

This runs Turborepo, which builds packages in dependency order:
1. `@clip/shared` -- TypeScript types and constants
2. `@clip/server` -- Fastify API server
3. `@clip/app` -- Vite frontend (static files)
4. `@clip/remotion` -- Remotion compositions

### Start the production server

```bash
NODE_ENV=production node packages/server/dist/index.js
```

In production mode:
- The server serves the built frontend from `packages/app/dist/` as static files.
- The browser auto-open on startup is disabled.
- The API and frontend are both served from the same port (default `4400`).

### Using a process manager

For reliability, use a process manager like PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start ClipFlow
pm2 start packages/server/dist/index.js --name clipflow --env production

# View logs
pm2 logs clipflow

# Auto-restart on crash
pm2 startup
pm2 save
```

---

## 6. System Check

After deployment, verify that all dependencies are detected by calling the system check endpoint:

```bash
curl http://localhost:4400/api/settings/system-check
```

Response:

```json
{
  "node": "v22.x.x",
  "platform": "linux",
  "ffmpeg": true,
  "whisperx": true,
  "chromium": true,
  "database": true
}
```

All values should be `true`. If any are `false`:

| Field | Fix |
|-------|-----|
| `ffmpeg` | Install FFmpeg: `apt install ffmpeg` (Linux) or `brew install ffmpeg` (macOS) |
| `whisperx` | Run `bash scripts/setup.sh` or set up the Python venv manually (see section 4) |
| `chromium` | Install Google Chrome or Chromium. On Linux: `apt install chromium-browser` |
| `database` | Should always be `true` -- the SQLite database is created automatically on first start |

---

## 7. Health Monitoring

ClipFlow provides a health endpoint for load balancers, uptime monitors, and orchestration systems:

```bash
curl http://localhost:4400/api/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-03-28T12:00:00.000Z",
  "uptime": 3600.5
}
```

- `status` -- Always `"ok"` if the server is responding.
- `timestamp` -- Current server time in ISO 8601.
- `uptime` -- Server uptime in seconds.

Use this endpoint for:
- Load balancer health checks (e.g., AWS ALB, nginx upstream checks).
- Uptime monitoring services (e.g., UptimeRobot, Pingdom).
- Kubernetes liveness probes.

---

## 8. Data Storage

All persistent data is stored in the `data/` directory at the project root. This directory is created automatically on first server start.

```
data/
  db/              SQLite database (clipflow.db)
  uploads/         Uploaded source video files
  audio/           Extracted audio tracks (for WhisperX)
  transcriptions/  Transcription output files
  renders/         Rendered export files (final MP4s)
  templates/       Custom template assets
```

### Backup

To back up ClipFlow, copy the entire `data/` directory. The SQLite database is a single file (`data/db/clipflow.db`) and can be backed up while the server is running (SQLite handles concurrent access safely for reads).

For a consistent backup of the database while writes are happening:

```bash
sqlite3 data/db/clipflow.db ".backup data/db/clipflow-backup.db"
```

### Disk space

Plan for disk space based on your usage:
- Source videos: up to 500 MB each.
- Audio extracts: roughly 10% of video file size.
- Rendered exports: varies by quality and duration, typically 20-100 MB per render.
- Database: small (usually under 50 MB even with thousands of projects).

---

## 9. Security Notes

### API keys

- **Never commit `.env` to version control.** The `.env` file contains your `ANTHROPIC_API_KEY` and optionally `HF_TOKEN`.
- Rotate your `ANTHROPIC_API_KEY` if it is ever exposed.

### Static file access

The server serves static files from `data/uploads/`, `data/renders/`, and `data/audio/` at `/static/` paths. In production:

- Restrict access to `/static/` paths behind authentication if the server is publicly accessible.
- Do not expose the `data/` directory directly via a file server.

### Reverse proxy

In production, place ClipFlow behind a reverse proxy such as nginx or Caddy. This provides:

- TLS/HTTPS termination.
- Rate limiting.
- Request size limits (important for the 500 MB upload limit).
- Access logging.

Example nginx configuration:

```nginx
server {
    listen 443 ssl;
    server_name clipflow.example.com;

    ssl_certificate     /etc/ssl/certs/clipflow.pem;
    ssl_certificate_key /etc/ssl/private/clipflow.key;

    client_max_body_size 550M;

    location / {
        proxy_pass http://127.0.0.1:4400;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Note the `proxy_set_header Upgrade` and `Connection "upgrade"` lines -- these are required for WebSocket connections to work.

### Firewall

- Only expose port 443 (HTTPS) publicly.
- Keep port 4400 (ClipFlow server) accessible only from localhost or the reverse proxy.

---

## 10. MCP Setup

ClipFlow includes an MCP (Model Context Protocol) server that integrates with Claude Code, Cursor, Windsurf, and other MCP-compatible tools.

### Add to Claude Code

```bash
claude mcp add clipflow -- npx @clip/mcp
```

### Available MCP tools

Once connected, the following tools are available:

| Tool | Description |
|------|-------------|
| `clipflow_create_video` | Upload and create a new video project |
| `clipflow_transcribe` | Start transcription for a project |
| `clipflow_analyze_video` | Run AI analysis on a transcribed project |
| `clipflow_list_templates` | List available templates |
| `clipflow_apply_template` | Apply a template to a project |
| `clipflow_render` | Render a project to a specific format |
| `clipflow_batch_process` | Start a batch processing job |

### Requirements

The ClipFlow server must be running for MCP tools to work. The MCP server communicates with the Fastify API on `http://localhost:4400`.

### Usage example (Claude Code)

After adding the MCP server, you can use natural language:

```
> Create a new video project from /path/to/video.mp4, transcribe it, analyze it, and render as a TikTok
```

Claude Code will call the appropriate MCP tools in sequence.
