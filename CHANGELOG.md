# Changelog

All notable changes to ClipFlow Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-04-01

> **Initial public release** — ClipFlow Framework is now open-source under the MIT License.

### Added

#### Core Pipeline
- **Video Upload** — Multipart upload up to 500MB, supports MP4, MOV, WebM, AVI
- **Audio Extraction** — FFmpeg-powered audio extraction (16kHz mono WAV) optimized for WhisperX
- **WhisperX Transcription** — Word-level timestamps, confidence scores, speaker diarization via Python sidecar
- **Claude AI Analysis** — Scene planning, hook quality scoring, CTA analysis, engagement prediction (0–100)
- **Remotion Rendering** — Programmatic video rendering via React-based compositions
- **Multi-format Export** — Instagram Reel (9:16), TikTok (9:16), Feed Square (1:1), Feed Portrait (4:5), Story (9:16)

#### Caption System
- **4 Caption Animation Styles** — `word-highlight`, `karaoke`, `pop`, `glow`
- **Custom Caption Styles** — Font family, size, weight, color, highlight color, stroke, position, shadow
- **Word-level Timing** — Synchronized captions from WhisperX word timestamps
- **Caption Presets** — Global presets reusable across projects

#### Template Engine
- **6 Built-in Niche Templates** — Fitness, Tech, Food, Education, E-commerce, Podcast
- **Template Configuration** — Hook strategy, CTA config, pacing, effects, transitions, caption style, color palette
- **Custom Templates** — Create, edit, and publish your own niche templates
- **Template Gallery** — Browse and preview templates before applying

#### ClipGen — AI Clip Detection
- **Viral Moment Detection** — Upload long videos (up to 60 min) and auto-detect the best short clips
- **Hook Score** — AI-powered scoring (0–100) for viral potential
- **Emotional Tone Detection** — humor, drama, surprise, insight, controversy, inspiration
- **Hashtag Suggestions** — Platform-specific hashtag generation
- **Clip Presets** — Save and reuse ClipGen analysis configurations
- **Batch Clip Rendering** — Render all selected clips sequentially

#### Timeline Editor
- **Multi-track Timeline** — Scenes, captions, and markers in a single view
- **Zoom Control** — `Ctrl+Scroll` for timeline zoom in/out
- **Keyboard Shortcuts** — `Space` (play/pause), `J/K/L` (playback speed), `Ctrl+Z` (undo)
- **Scene Markers** — Visual markers from AI scene analysis

#### Batch Processing
- **Batch Queue** — Process multiple videos sequentially
- **Pause/Resume** — Stop and continue batch jobs at any time
- **Error Resilience** — Failed items don't block remaining queue
- **Progress Tracking** — Per-item and overall batch progress

#### MCP Server Integration
- **7 MCP Tools** — `clipflow_transcribe`, `clipflow_analyze_video`, `clipflow_list_templates`, `clipflow_apply_template`, `clipflow_render`, `clipflow_batch_process`, `clipflow_create_video`
- **Claude Code Integration** — Use ClipFlow tools directly from Claude Code
- **Cursor / Windsurf Support** — Works with any MCP-compatible IDE

#### Internationalization
- **English + Portuguese (pt-BR)** — Full UI localization
- **Language Switcher** — Available in the sidebar

#### API
- **52 REST Endpoints** — Full CRUD across 11 modules
- **Swagger Documentation** — Auto-generated at `/docs`
- **WebSocket** — Real-time progress streaming for transcription and rendering
- **Health Check** — System status at `/api/health`

#### Infrastructure
- **Monorepo** — pnpm workspaces + Turborepo
- **SQLite + Drizzle ORM** — Type-safe, local-first database with automatic migrations
- **FFmpeg Static** — Bundled FFmpeg for zero-install video processing
- **WhisperX Python Sidecar** — Managed Python environment with virtual env setup script

---

## [Unreleased]

> Features planned or in active development. See [Issues](https://github.com/willianfellipe-coder/clipflow-framework-editor/issues) for status.

### Planned
- WebSocket authentication (per-project rooms)
- Database indexes for high-volume usage
- Pagination on all list endpoints
- React Error Boundaries
- Undo/redo in caption editor
- History page with render export log
- CI/CD pipeline (GitHub Actions)
- Docker support for production deployment
- Multi-speaker caption color differentiation
- Timeline virtualization for long videos

---

[1.0.0]: https://github.com/willianfellipe-coder/clipflow-framework-editor/releases/tag/v1.0.0
