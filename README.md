# ClipFlow Framework

**AI-powered video editing framework for Instagram Reels, TikTok, and YouTube Shorts.**

ClipFlow is a local-first, monorepo-based video editing platform that combines AI transcription (WhisperX), AI analysis (Claude), and programmatic video rendering (Remotion) into a single web application. Upload a video, get it transcribed, analyzed, edited with animated captions, and exported in multiple social media formats — all from your browser.

## Features

| Feature | Description |
|---------|-------------|
| **Upload & Transcription** | Upload videos (MP4, MOV, WebM, AVI), extract audio, transcribe with WhisperX (word-level timestamps, speaker diarization) |
| **AI Analysis** | Claude analyzes transcription to generate scene plans, hook quality scores, CTA analysis, engagement predictions (0-100) |
| **Remotion Preview** | Live video preview with 4 caption animation styles: word-highlight, karaoke, pop, glow |
| **Timeline Editor** | Multi-track timeline with scenes, captions, zoom (Ctrl+Scroll), keyboard shortcuts (Space, J/K/L, Ctrl+Z) |
| **Template Engine** | 6 built-in niche templates (Fitness, Tech, Food, Education, E-commerce, Podcast) with full config: hook strategy, CTA, pacing, effects, transitions, caption style, colors |
| **Multi-format Export** | Render to Instagram Reel (9:16), TikTok (9:16), Feed Square (1:1), Feed Portrait (4:5), Story (9:16) with 4 quality presets |
| **Batch Processing** | Process multiple videos sequentially with error resilience, pause/resume support |
| **ClipGen** | AI-powered viral clip detection — analyze long videos and generate optimized short clips with hook scores, emotional tone, suggested hashtags |
| **MCP Server** | 7 tools for Claude Code / Cursor / Windsurf integration |
| **i18n** | English + Portuguese (pt-BR) with sidebar language switcher |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Frontend** | Vite 6, React 19, Tailwind CSS 4, Zustand 5, Plus Jakarta Sans |
| **Backend** | Fastify 5, SQLite (better-sqlite3), Drizzle ORM, WebSocket |
| **Video** | Remotion 4.x, FFmpeg 7 (ffmpeg-static) |
| **AI** | Claude API (Anthropic SDK), WhisperX (Python sidecar) |
| **MCP** | @modelcontextprotocol/sdk (stdio transport) |

## Quick Start

```bash
# Prerequisites: Node.js 22+, Python 3.10+, FFmpeg, pnpm 9+

# Clone and install
git clone https://github.com/willianfellipe-coder/clipflow-framework.git
cd clipflow-framework
pnpm install

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start development (5 packages, opens browser automatically)
pnpm dev
```

| Service | URL |
|---------|-----|
| **App** | http://localhost:4401 |
| **API** | http://localhost:4400 |
| **Swagger Docs** | http://localhost:4400/docs |
| **Health Check** | http://localhost:4400/api/health |

## Setup WhisperX (optional, for transcription)

```bash
bash scripts/setup.sh
```

## Project Structure

```
clipflow-framework/
  packages/
    app/        — Frontend SPA (React 19 + Vite 6 + Tailwind 4)
    server/     — Backend API (Fastify 5 + SQLite + Drizzle ORM)
    shared/     — TypeScript types, Zod schemas, constants
    remotion/   — Video compositions, caption animations, effects
    mcp/        — MCP server for IDE integration (7 tools)
  whisper/      — Python WhisperX sidecar for transcription
  scripts/      — Setup and build scripts
  docs/         — Technical and user documentation
  data/         — Local data storage (gitignored)
```

## Documentation

| Document | Description |
|----------|-------------|
| [User Guide](docs/USER_GUIDE.md) | How to use ClipFlow — upload, edit, export, ClipGen |
| [API Reference](docs/API.md) | All 52 API endpoints with request/response examples |
| [Architecture](docs/ARCHITECTURE.md) | System design, database schema, data flow, WebSocket events |
| [Deployment](docs/DEPLOYMENT.md) | Production setup, prerequisites, environment config |
| [Contributing](docs/CONTRIBUTING.md) | Development setup, code style, adding features |

## MCP Integration (Claude Code / Cursor)

```bash
# Add ClipFlow as MCP tool
claude mcp add clipflow -- npx @clip/mcp

# Available tools:
# clipflow_transcribe, clipflow_analyze_video, clipflow_list_templates,
# clipflow_apply_template, clipflow_render, clipflow_batch_process,
# clipflow_create_video
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | For AI | — | Claude API key for analysis and ClipGen |
| `HF_TOKEN` | Optional | — | HuggingFace token for speaker diarization |
| `PORT` | No | 4400 | Server port |
| `APP_PORT` | No | 4401 | Frontend dev port |
| `NODE_ENV` | No | development | Set to `production` for optimized logging |

## API Overview

52 endpoints across 11 modules. Full reference: [docs/API.md](docs/API.md)

| Module | Endpoints | Key Operations |
|--------|-----------|---------------|
| Projects | 6 | CRUD + apply-template |
| Upload | 1 | Multipart video upload (max 500MB) |
| Transcription | 2 | WhisperX trigger + result |
| Analysis | 2 | Claude AI scene planning |
| Scenes | 5 | CRUD + reorder |
| Captions | 5 | Word timestamps + style presets |
| Templates | 6 | CRUD + preview |
| Render | 6 | Single/multi-format + download + cancel |
| Batch | 6 | Job management + start/pause |
| ClipGen | 10 | AI clip analysis + CRUD + presets |
| Settings | 4 | Config + health check |

## License

Private
