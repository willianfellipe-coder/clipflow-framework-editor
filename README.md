# ClipFlow Framework

AI-powered video editing framework for Instagram Reels, TikTok, and YouTube Shorts.

## Features

- **Upload & Transcription** — Upload videos, extract audio, transcribe with WhisperX (word-level timestamps)
- **AI Analysis** — Claude analyzes transcription to generate scene plans, hook scores, engagement predictions
- **Remotion Preview** — Live video preview with 4 caption animations (highlight, karaoke, pop, glow)
- **Timeline Editor** — Multi-track timeline with scenes, captions, keyboard shortcuts
- **Template Engine** — 6 built-in niche templates (fitness, tech, food, education, ecommerce, podcast)
- **Multi-format Export** — Render to Reel (9:16), TikTok, Feed (1:1, 4:5), Story with quality presets
- **Batch Processing** — Process multiple videos sequentially with error resilience
- **ClipGen** — AI-powered viral clip detection from long videos (TikTok/Shorts/Reels)
- **MCP Server** — 7 tools for Claude Code / Cursor / Windsurf integration
- **i18n** — English + Portuguese (pt-BR) with language switcher

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Vite 6, React 19, Tailwind CSS 4, Zustand 5 |
| Backend | Fastify 5, SQLite (better-sqlite3), Drizzle ORM |
| Video | Remotion 4.x, FFmpeg |
| AI | Claude API (Anthropic SDK), WhisperX |
| MCP | @modelcontextprotocol/sdk |

## Quick Start

```bash
# Prerequisites: Node.js 22+, Python 3.10+, FFmpeg, pnpm 9+

# Clone and install
git clone https://github.com/willianfellipe-coder/clipflow-framework.git
cd clipflow-framework
pnpm install

# Configure
cp .env.example .env
# Edit .env: add ANTHROPIC_API_KEY

# Start development (opens browser)
pnpm dev
# Server: http://localhost:4400
# App:    http://localhost:4401
# Docs:   http://localhost:4400/docs
```

## Setup WhisperX (for transcription)

```bash
bash scripts/setup.sh
```

## Project Structure

```
clipflow/
  packages/
    app/        — Frontend (React + Vite + Tailwind)
    server/     — Backend API (Fastify + SQLite)
    shared/     — Types, schemas, constants
    remotion/   — Video compositions and caption animations
    mcp/        — MCP server for IDE integration
  whisper/      — Python WhisperX sidecar
  scripts/      — Setup and build scripts
  docs/         — Specifications and audit reports
```

## MCP Integration

```bash
# Add to Claude Code
claude mcp add clipflow -- npx @clip/mcp

# Available tools: clipflow_create_video, clipflow_transcribe,
# clipflow_analyze_video, clipflow_list_templates, clipflow_apply_template,
# clipflow_render, clipflow_batch_process
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | For AI features | Claude API key |
| `HF_TOKEN` | Optional | HuggingFace token (speaker diarization) |
| `PORT` | No (default: 4400) | Server port |
| `APP_PORT` | No (default: 4401) | Frontend port |

## API Documentation

Swagger UI available at `http://localhost:4400/docs` when running in development.

## License

Private
