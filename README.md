<div align="center">

<h1>
  <img src="https://raw.githubusercontent.com/willianfellipe-coder/clipflow-framework-editor/main/design-system/logo.svg" alt="ClipFlow" width="48" height="48" />
  &nbsp;ClipFlow Framework
</h1>

<p><strong>AI-powered video editing framework for Instagram Reels, TikTok & YouTube Shorts.</strong><br/>
Upload → Transcribe → Analyze → Edit → Export. Fully local. Fully yours.</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green?logo=node.js)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9%2B-orange?logo=pnpm)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)

</div>

---

## What is ClipFlow?

**ClipFlow** is a local-first, monorepo-based video editing platform that combines:

- 🎙 **WhisperX** — word-level transcription with speaker diarization
- 🤖 **Claude AI** — scene planning, hook scoring, CTA analysis, viral clip detection
- 🎬 **Remotion** — programmatic video rendering with animated captions
- 📦 **Local SQLite** — zero-configuration, your data stays on your machine

Upload a video → get it transcribed → have AI plan the edit → preview with live animated captions → export to all social formats. No cloud uploads. No subscriptions. No black boxes.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Upload & Transcription** | Upload MP4/MOV/WebM/AVI (up to 500MB), extract audio, transcribe with WhisperX (word-level timestamps + speaker diarization) |
| **AI Scene Planning** | Claude analyzes the transcription to generate scene plans, hook quality scores (0–100), CTA analysis, and engagement predictions |
| **Remotion Preview** | Live video preview with 4 caption animation styles: `word-highlight`, `karaoke`, `pop`, `glow` |
| **Timeline Editor** | Multi-track timeline with scenes, captions, zoom (`Ctrl+Scroll`), keyboard shortcuts (`Space`, `J/K/L`, `Ctrl+Z`) |
| **Template Engine** | 6 built-in niche templates (Fitness, Tech, Food, Education, E-commerce, Podcast) with full config: hook strategy, CTA, pacing, effects, transitions, caption style, colors |
| **Multi-format Export** | Render to Instagram Reel (9:16), TikTok (9:16), Feed Square (1:1), Feed Portrait (4:5), Story (9:16) with 4 quality presets |
| **ClipGen** | AI-powered viral clip detection — analyze long videos and auto-generate optimized short clips with hook scores, emotional tone tagging, and hashtag suggestions |
| **Batch Processing** | Process multiple videos sequentially with pause/resume and error resilience |
| **MCP Server** | 7 integration tools for Claude Code, Cursor, and Windsurf |
| **i18n** | English + Portuguese (pt-BR) with in-app language switcher |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Frontend** | Vite 6, React 19, Tailwind CSS 4, Zustand 5, Plus Jakarta Sans |
| **Backend** | Fastify 5, SQLite (better-sqlite3), Drizzle ORM, WebSocket |
| **Video** | Remotion 4.x, FFmpeg 7 (ffmpeg-static — no install needed) |
| **AI** | Claude API (Anthropic SDK), WhisperX (Python sidecar) |
| **MCP** | @modelcontextprotocol/sdk (stdio transport) |

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 22+ |
| pnpm | 9+ |
| Python | 3.10+ (for WhisperX transcription) |

### 1. Clone & Install

```bash
git clone https://github.com/willianfellipe-coder/clipflow-framework-editor.git
cd clipflow-framework-editor
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and add your API key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here   # Required for AI analysis
HF_TOKEN=hf_your_token_here              # Optional — for speaker diarization
```

> **Get your Anthropic API key:** [console.anthropic.com](https://console.anthropic.com)  
> **Get a HuggingFace token:** [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (free, optional)

### 3. Setup WhisperX (optional, for transcription)

```bash
bash scripts/setup.sh
```

This creates a Python virtual environment and installs WhisperX and its dependencies automatically.

### 4. Start Development

```bash
pnpm dev
```

This starts all 5 packages in parallel:

| Service | URL | Description |
|---------|-----|-------------|
| **App** | http://localhost:4401 | Frontend SPA |
| **API** | http://localhost:4400 | Backend REST API |
| **Swagger** | http://localhost:4400/docs | API documentation |
| **Health Check** | http://localhost:4400/api/health | System status |

The browser opens automatically. 🎉

---

## 📁 Project Structure

```
clipflow-framework-editor/
├── packages/
│   ├── app/         — Frontend SPA (React 19 + Vite 6 + Tailwind 4)
│   ├── server/      — Backend API (Fastify 5 + SQLite + Drizzle ORM)
│   ├── shared/      — TypeScript types, Zod schemas, constants
│   ├── remotion/    — Video compositions, caption animations, effects
│   └── mcp/         — MCP server for IDE integration (7 tools)
├── whisper/          — Python WhisperX sidecar for transcription
├── scripts/          — Setup and utility scripts
├── docs/             — Full project documentation
├── design-system/    — Design tokens and assets
└── data/             — Local data storage (gitignored — your files stay local)
```

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | For AI features | — | Claude API key for analysis, ClipGen, and scene planning |
| `HF_TOKEN` | Optional | — | HuggingFace token for speaker diarization in WhisperX |
| `PORT` | No | `4400` | Backend server port |
| `APP_PORT` | No | `4401` | Frontend dev server port |
| `DATABASE_URL` | No | `./data/db/clipflow.db` | SQLite database path |
| `NODE_ENV` | No | `development` | Set to `production` for optimized output |

---

## 🔌 MCP Server Integration

ClipFlow exposes an MCP server compatible with Claude Code, Cursor, and Windsurf.

### Add to Claude Code

```bash
claude mcp add clipflow -- npx @clip/mcp
```

### Available Tools

| Tool | Description |
|------|-------------|
| `clipflow_transcribe` | Transcribe a video using WhisperX |
| `clipflow_analyze_video` | Run Claude AI analysis on a transcription |
| `clipflow_list_templates` | List all available niche templates |
| `clipflow_apply_template` | Apply a template to a project |
| `clipflow_render` | Trigger a Remotion render for a project |
| `clipflow_batch_process` | Start a batch processing job |
| `clipflow_create_video` | Full pipeline: upload → transcribe → analyze → render |

---

## 📡 API Overview

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

### WebSocket Events

Connect to `ws://localhost:4400/ws` for real-time progress:

```
transcription:progress   { projectId, percent, currentSegment }
transcription:complete   { projectId, transcriptionId }
analysis:progress        { projectId, stage }
analysis:complete        { projectId, analysisId }
render:progress          { renderId, percent, currentFrame, totalFrames, eta }
render:complete          { renderId, outputPath, fileSize }
render:error             { renderId, error }
batch:item:progress      { batchId, itemId, stage, percent }
batch:complete           { batchId, stats }
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [User Guide](docs/USER_GUIDE.md) | How to use ClipFlow — upload, edit, export, ClipGen |
| [API Reference](docs/API.md) | All 52 API endpoints with request/response examples |
| [Architecture](docs/ARCHITECTURE.md) | System design, database schema, data flow, WebSocket events |
| [Deployment](docs/DEPLOYMENT.md) | Production setup, prerequisites, environment config |
| [Contributing](docs/CONTRIBUTING.md) | Development setup, code style, how to submit PRs |
| [Changelog](CHANGELOG.md) | Version history and release notes |

---

## 🧱 Architecture Overview

```
┌───────────────────────────────────────────────────────┐
│                  ClipFlow Monorepo                    │
│                                                       │
│  ┌──────────────┐    ┌──────────────────────────────┐ │
│  │  @clip/app   │    │        @clip/server          │ │
│  │  React 19    │◄──►│  Fastify 5  │  SQLite        │ │
│  │  Vite 6      │    │  WebSocket  │  Drizzle ORM   │ │
│  │  Tailwind 4  │    │  FFmpeg     │  WhisperX      │ │
│  └──────────────┘    └──────────────────────────────┘ │
│                                                       │
│  ┌──────────────┐    ┌──────────────┐                 │
│  │ @clip/remotion│   │ @clip/shared │                 │
│  │  Compositions │   │  Types       │                 │
│  │  Captions     │   │  Zod Schemas │                 │
│  │  Effects      │   │  Constants   │                 │
│  └──────────────┘    └──────────────┘                 │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  @clip/mcp — MCP Server (Claude Code / Cursor)  │  │
│  │  7 Tools via stdio transport                    │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design, database schema, and data flow diagrams.

---

## 🤝 Contributing

Contributions are very welcome! Whether it's bug fixes, new features, documentation improvements, or translations — all PRs are reviewed.

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/your-feature-name`
3. **Commit** your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. **Open** a Pull Request with a clear description

Read the full guide: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

### Good First Issues

Looking for a place to start? Check issues labeled [`good first issue`](https://github.com/willianfellipe-coder/clipflow-framework-editor/issues?q=label%3A%22good+first+issue%22).

---

## 🗺 Roadmap

- [ ] WebSocket authentication (per-project rooms)
- [ ] Pagination on all list endpoints
- [ ] React Error Boundaries
- [ ] Undo/redo in caption editor
- [ ] Export history page
- [ ] GitHub Actions CI/CD pipeline
- [ ] Docker production container
- [ ] Multi-speaker caption colors (podcast support)
- [ ] Timeline virtualization for long videos

Follow progress in [CHANGELOG.md](CHANGELOG.md) and [GitHub Issues](https://github.com/willianfellipe-coder/clipflow-framework-editor/issues).

---

## 👤 Author

**Willian Santos**

- GitHub: [@willianfellipe-coder](https://github.com/willianfellipe-coder)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright © 2026 Willian Santos.
