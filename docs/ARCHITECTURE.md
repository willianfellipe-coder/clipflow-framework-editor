# ClipFlow Architecture

## 1. Monorepo Structure

ClipFlow is a pnpm workspace monorepo managed by Turborepo with 5 packages:

```
clipflow/
├── packages/
│   ├── app/          @clip/app       — React frontend (Vite + TailwindCSS v4)
│   ├── server/       @clip/server    — Fastify API server + background processing
│   ├── shared/       @clip/shared    — Shared types, constants, Zod schemas
│   ├── remotion/     @clip/remotion  — Remotion video compositions
│   └── mcp/          @clip/mcp       — Model Context Protocol server
├── data/                             — Runtime data (DB, uploads, renders)
│   ├── db/clipflow.db
│   ├── uploads/
│   ├── audio/
│   ├── transcriptions/
│   ├── renders/
│   └── templates/
├── whisper/                          — WhisperX Python environment
├── scripts/                          — Build/dev scripts
├── design-system/                    — Design tokens and guidelines
├── docs/                             — Documentation
├── turbo.json                        — Turborepo pipeline config
└── pnpm-workspace.yaml
```

### Package Dependencies

```
@clip/app ──────► @clip/shared
    │              ▲       ▲
    └──► @clip/remotion     │
              │              │
              └──────────────┘
@clip/server ──► @clip/shared
@clip/mcp    ──► (HTTP calls to @clip/server)
```

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19 |
| **Routing** | React Router | 7.1 |
| **State** | Zustand + Immer | 5 / 10 |
| **Styling** | TailwindCSS | 4 |
| **Icons** | Lucide React | 0.468 |
| **i18n** | react-i18next | 15 |
| **Build (FE)** | Vite | 6 |
| **Backend** | Fastify | 5.2 |
| **Database** | SQLite (better-sqlite3) | 11.8 |
| **ORM** | Drizzle ORM | 0.38 |
| **Video Render** | Remotion | 4 |
| **AI** | Anthropic SDK (Claude) | 0.39 |
| **Transcription** | WhisperX (Python) | large-v3 |
| **Video Processing** | FFmpeg / FFprobe | static binaries |
| **Validation** | Zod | 3.24 |
| **IDs** | nanoid | 5 |
| **Logging** | Pino + pino-pretty | 9 / 13 |
| **WebSocket** | @fastify/websocket | 11 |
| **MCP** | @modelcontextprotocol/sdk | 1 |
| **Monorepo** | pnpm + Turborepo | 9.15 / 2.4 |
| **Language** | TypeScript | 5.5 |

## 3. Database Schema

SQLite database at `data/db/clipflow.db`, managed by Drizzle ORM. 13 tables:

```
┌─────────────────────┐
│      projects       │ ◄── Central entity
├─────────────────────┤
│ id (PK)             │
│ name                │
│ description         │
│ status (enum)       │──── draft | transcribing | analyzing | editing | rendering | done | error
│ sourceVideoPath     │
│ sourceVideoMeta     │──── JSON: duration, width, height, fps
│ thumbnailPath       │
│ templateId (FK)     │───► templates.id
│ nicheId             │
│ settings            │──── JSON: captionStyleId, hookConfig, ctaConfig, etc.
│ createdAt, updatedAt│
└─────────┬───────────┘
          │
          │ 1:N
          ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  transcriptions   │   │    analyses        │   │     scenes        │
├───────────────────┤   ├───────────────────┤   ├───────────────────┤
│ id (PK)           │   │ id (PK)           │   │ id (PK)           │
│ projectId (FK)    │   │ projectId (FK)    │   │ projectId (FK)    │
│ model             │   │ transcriptionId   │   │ analysisId (FK)   │
│ language          │   │ model             │   │ order             │
│ fullText          │   │ prompt            │   │ startTime, endTime│
│ wordTimestamps    │   │ response          │   │ type (enum)       │
│ segments          │   │ scenePlan         │   │ description       │
│ speakers          │   │ suggestedCuts     │   │ captionText       │
│ duration          │   │ suggestedEffects  │   │ effects (JSON)    │
│ processingTime    │   │ hookAnalysis      │   │ zoomConfig (JSON) │
│ createdAt         │   │ ctaAnalysis       │   │ transitionIn/Out  │
└───────────────────┘   │ contentScore      │   │ isActive          │
                        │ tokensUsed        │   │ createdAt         │
                        │ createdAt         │   └───────────────────┘
                        └───────────────────┘

┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  caption_styles   │   │    templates      │   │     renders       │
├───────────────────┤   ├───────────────────┤   ├───────────────────┤
│ id (PK)           │   │ id (PK)           │   │ id (PK)           │
│ projectId (FK)    │   │ name              │   │ projectId (FK)    │
│ name              │   │ description       │   │ format (enum)     │
│ isPreset          │   │ niche             │   │ status (enum)     │
│ fontFamily        │   │ isBuiltIn         │   │ outputPath        │
│ fontSize          │   │ isPublished       │   │ width, height     │
│ fontWeight        │   │ composition       │   │ fps, codec        │
│ color             │   │ defaultCaptionId  │   │ quality (enum)    │
│ highlightColor    │   │ defaultEffects    │   │ fileSize          │
│ strokeColor/Width │   │ defaultTransitions│   │ renderTime        │
│ background*       │   │ colorPalette      │   │ progress          │
│ position (enum)   │   │ musicConfig       │   │ errorMessage      │
│ animation (enum)  │   │ hookConfig        │   │ compositionProps  │
│ maxWordsPerLine   │   │ ctaConfig         │   │ createdAt         │
│ shadowConfig      │   │ layoutConfig      │   │ completedAt       │
│ createdAt         │   │ usageCount        │   └───────────────────┘
└───────────────────┘   │ createdAt/Updated │
                        └───────────────────┘

┌───────────────────┐   ┌───────────────────┐
│    batch_jobs     │   │   batch_items     │
├───────────────────┤   ├───────────────────┤
│ id (PK)           │   │ id (PK)           │
│ name              │   │ batchJobId (FK)   │
│ status (enum)     │   │ projectId (FK)    │
│ templateId (FK)   │   │ sourceVideoPath   │
│ captionStyleId    │   │ status (enum)     │
│ formats (JSON)    │   │ errorMessage      │
│ totalVideos       │   │ order             │
│ completedVideos   │   │ createdAt         │
│ failedVideos      │   └───────────────────┘
│ settings (JSON)   │
│ createdAt         │
│ completedAt       │
└───────────────────┘

┌───────────────────┐
│     settings      │
├───────────────────┤
│ key (PK)          │
│ value             │
│ updatedAt         │
└───────────────────┘

┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  clip_analyses    │   │      clips        │   │   clip_presets    │
├───────────────────┤   ├───────────────────┤   ├───────────────────┤
│ id (PK)           │   │ id (PK)           │   │ id (PK)           │
│ projectId (FK)    │   │ projectId (FK)    │   │ name              │
│ transcriptionId   │   │ analysisId (FK)   │   │ description       │
│ targetDuration    │   │ startTime/endTime │   │ targetDuration    │
│ numberOfClips     │   │ title             │   │ numberOfClips     │
│ targetPlatform    │   │ hookSentence      │   │ targetPlatform    │
│ niche, tone       │   │ hookScore         │   │ niche, tone       │
│ customInstructions│   │ emotionalTone     │   │ customInstructions│
│ rawResponse       │   │ suggestedHashtags │   │ captionStyleId    │
│ clipsGenerated    │   │ aiReason          │   │ captionAnimation  │
│ modelUsed         │   │ captionStyleId    │   │ zoomConfig        │
│ tokensUsed        │   │ captionAnimation  │   │ ctaConfig         │
│ status (enum)     │   │ aspectRatio       │   │ isBuiltIn         │
│ errorMessage      │   │ zoomConfig        │   │ createdAt/Updated │
│ createdAt         │   │ ctaConfig         │   └───────────────────┘
│ completedAt       │   │ showProgressBar   │
└───────────────────┘   │ status (enum)     │
                        │ orderIndex        │
                        │ quality           │
                        │ outputFormat      │
                        │ targetPlatform    │
                        │ renderId (FK)     │
                        │ outputPath        │
                        │ thumbnailPath     │
                        │ createdAt/Updated │
                        └───────────────────┘
```

## 4. Data Flow Diagrams

### Main Pipeline: Upload to Render

```
 ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐
 │  UPLOAD  │───►│  TRANSCRIBE  │───►│   ANALYZE    │───►│   EDIT   │───►│  RENDER  │
 │          │    │              │    │              │    │          │    │          │
 │ POST     │    │ POST         │    │ POST         │    │ Scenes   │    │ POST     │
 │ /upload  │    │ /transcribe  │    │ /analyze     │    │ Captions │    │ /render  │
 └──────────┘    └──────────────┘    └──────────────┘    │ Template │    └──────────┘
      │                │                    │             └──────────┘         │
      ▼                ▼                    ▼                  │               ▼
 ┌──────────┐    ┌──────────────┐    ┌──────────────┐         │          ┌──────────┐
 │ projects │    │transcriptions│    │  analyses +  │         │          │ renders  │
 │ (draft)  │    │ word_stamps  │    │   scenes     │         │          │ (.mp4)   │
 └──────────┘    └──────────────┘    └──────────────┘         │          └──────────┘
                                                              │
                       ┌──────────────────────────────────────┘
                       ▼
              WebSocket broadcasts progress at every stage
```

**Status transitions:**
```
draft ──► transcribing ──► draft ──► analyzing ──► editing ──► rendering ──► done
                │                        │                         │
                └────────► error ◄───────┴─────────────────────────┘
```

### ClipGen Pipeline

```
 ┌───────────────────┐    ┌──────────────────┐    ┌──────────────────┐
 │  EXISTING PROJECT │    │  CLIP ANALYSIS   │    │   CLIP CURATION  │
 │  (transcribed)    │───►│                  │───►│                  │
 │                   │    │ POST /clips/     │    │ PATCH /clips/:id │
 │                   │    │ analyze/:pid     │    │ select / reject  │
 └───────────────────┘    └──────────────────┘    └──────────────────┘
                                  │                        │
                                  ▼                        ▼
                          ┌──────────────┐         ┌──────────────┐
                          │ clip_analyses│         │    clips      │
                          │ (AI picks    │         │ (suggested → │
                          │  moments)    │         │  selected →  │
                          └──────────────┘         │  rendering → │
                                                   │  done)       │
                                                   └──────────────┘
```

### Batch Pipeline

```
 ┌──────────────────┐     ┌───────────────────────────────────────┐
 │ POST /api/batch  │────►│  For each video in batch:             │
 │ {videoPaths,     │     │                                       │
 │  templateId,     │     │  1. Create project                    │
 │  formats}        │     │  2. Extract audio → Transcribe        │
 │                  │     │  3. Analyze → Generate scenes          │
 │ POST /batch/:id/ │     │  4. Apply template                    │
 │ start            │     │  5. Render all requested formats       │
 └──────────────────┘     │                                       │
                          │  WebSocket: batch:item:progress/complete│
                          │  On all done: batch:complete            │
                          └───────────────────────────────────────┘
```

## 5. Template System

Templates define the visual identity and composition settings for video output.

### Template Config Flow

```
 1. SEED                      2. APPLY                     3. RENDER
 ┌─────────────────┐         ┌─────────────────┐          ┌─────────────────┐
 │ Built-in niche  │         │ POST /projects/  │          │ processRender() │
 │ templates seeded│────────►│ :id/apply-template│─────────►│                 │
 │ on first boot   │         │                  │          │ Resolves:       │
 └─────────────────┘         │ Copies:          │          │  - captionStyle │
                             │  - captionStyleId│          │  - animation    │
 ┌─────────────────┐         │  - hookConfig    │          │  - ctaConfig    │
 │ Custom template │         │  - ctaConfig     │          │  - layoutConfig │
 │ POST /templates │────────►│  - colorPalette  │          │  - progressBar  │
 └─────────────────┘         │  - layoutConfig  │          │                 │
                             │  - musicConfig   │          │ Builds          │
                             │                  │          │ compositionProps│
                             │ Also applies     │          │ for Remotion    │
                             │ effects/         │          └─────────────────┘
                             │ transitions to   │
                             │ existing scenes  │
                             └─────────────────┘
```

### Template Fields

| Field | Purpose | Format |
|-------|---------|--------|
| `composition` | Remotion composition ID | `"ReelComposition"` |
| `defaultCaptionStyleId` | FK to caption_styles | string |
| `defaultEffects` | Effects applied to scenes | JSON array |
| `defaultTransitions` | Transition styles | JSON array |
| `colorPalette` | Brand colors | JSON array of hex |
| `hookConfig` | Hook overlay settings | JSON object |
| `ctaConfig` | CTA overlay settings | JSON `{enabled, text, subtext, durationSeconds}` |
| `layoutConfig` | Layout overrides | JSON `{showProgressBar}` |
| `musicConfig` | Background music | JSON object |

## 6. WebSocket Events

Connection: `ws://localhost:4400/ws`

All messages are JSON with `{ event, data }` structure.

### Transcription Events

| Event | Data Shape |
|-------|-----------|
| `transcription:progress` | `{ projectId: string, percent: number, currentSegment: string }` |
| `transcription:complete` | `{ projectId: string, transcriptionId: string }` |
| `transcription:error` | `{ projectId: string, error: string }` |

### Analysis Events

| Event | Data Shape |
|-------|-----------|
| `analysis:progress` | `{ projectId: string, stage: string }` |
| `analysis:complete` | `{ projectId: string, analysisId: string }` |
| `analysis:error` | `{ projectId: string, error: string }` |

### Render Events

| Event | Data Shape |
|-------|-----------|
| `render:progress` | `{ renderId: string, percent: number, currentFrame: number, totalFrames: number, eta: number }` |
| `render:complete` | `{ renderId: string, outputPath: string, fileSize: number }` |
| `render:error` | `{ renderId: string, error: string }` |

### Batch Events

| Event | Data Shape |
|-------|-----------|
| `batch:item:progress` | `{ batchId: string, itemId: string, stage: string }` |
| `batch:item:complete` | `{ batchId: string, itemId: string }` |
| `batch:complete` | `{ batchId: string }` |

### ClipGen Events

| Event | Data Shape |
|-------|-----------|
| `clipgen:progress` | `{ analysisId: string, stage: string }` |
| `clipgen:complete` | `{ analysisId: string, projectId: string, clipsGenerated: number }` |
| `clipgen:error` | `{ analysisId: string, error: string }` |

## 7. MCP Integration

The `@clip/mcp` package provides a Model Context Protocol server that exposes ClipFlow as tools for AI assistants (Claude Desktop, Cursor, etc.).

**Transport:** stdio (standard input/output)
**Config env:** `CLIPFLOW_URL` (default: `http://localhost:4400`)

### 7 MCP Tools

| Tool | Description | Maps to HTTP API |
|------|-------------|-----------------|
| `clipflow_create_video` | Full pipeline: upload, transcribe, analyze, render | Convenience wrapper (file upload requires web UI) |
| `clipflow_transcribe` | Transcribe a project | `POST /api/projects/:id/transcribe` |
| `clipflow_analyze_video` | AI analysis with engagement scoring | `POST /api/projects/:id/analyze` |
| `clipflow_list_templates` | List available templates | `GET /api/templates` |
| `clipflow_apply_template` | Apply template to project | `POST /api/projects/:id/apply-template` |
| `clipflow_render` | Render a project in a given format | `POST /api/projects/:id/render` |
| `clipflow_batch_process` | Process multiple videos, auto-starts | `POST /api/batch` + `POST /api/batch/:id/start` |

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "clipflow": {
      "command": "tsx",
      "args": ["packages/mcp/src/index.ts"],
      "env": {
        "CLIPFLOW_URL": "http://localhost:4400"
      }
    }
  }
}
```

## 8. Security Measures

### SEC-002: Path Traversal Protection (Render Download)

The `/api/renders/:id/download` endpoint resolves the output path and verifies it starts with the `renders/` directory before serving the file:

```
resolvedPath = path.resolve(render.outputPath)
rendersDir   = path.resolve(PATHS.renders)
if (!resolvedPath.startsWith(rendersDir)) → 403 PATH_TRAVERSAL
```

### SEC-005: PATCH Whitelist (Projects)

`PATCH /api/projects/:id` only accepts whitelisted fields: `name`, `description`, `nicheId`, `settings`. Any other fields in the request body are silently ignored, preventing clients from overwriting `status`, `sourceVideoPath`, or other protected fields.

### SEC-008: Batch Path Validation

`POST /api/batch` validates every video path:
- Rejects paths containing `..` (directory traversal)
- Rejects paths containing null bytes (`\0`)
- Verifies each file exists on disk via `existsSync()`

### DAT-001: Atomic Status Updates

Analysis uses an atomic `UPDATE ... WHERE status != 'analyzing'` check to prevent race conditions when concurrent requests try to start analysis on the same project. Returns `409 Conflict` if already in progress.

### Clip Update Whitelisting

`PATCH /api/clips/:clipId` only accepts a defined set of fields: `title`, `hookSentence`, `startTime`, `endTime`, `captionAnimation`, `aspectRatio`, `quality`, `targetPlatform`, `orderIndex`, `showProgressBar`. JSON fields (`suggestedHashtags`, `zoomConfig`, `ctaConfig`) are serialized before storage.

## 9. i18n System

Internationalization uses `react-i18next` with browser language detection.

### Configuration

- **Library:** i18next + react-i18next + i18next-browser-languagedetector
- **Languages:** English (`en`), Brazilian Portuguese (`pt-BR`)
- **Fallback:** `en`
- **Detection order:** `localStorage` then `navigator`
- **Cache:** `localStorage`

### File Structure

```
packages/app/src/
├── lib/i18n.ts              — i18n initialization
└── locales/
    ├── en.json              — English translations
    └── pt-BR.json           — Brazilian Portuguese translations
```

### Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('projects.title')}</h1>;
}
```

### Language Switching

Language preference is stored in `localStorage` and also available via the Settings API (`PATCH /api/settings` with `{ "language": "pt-BR" }`).
