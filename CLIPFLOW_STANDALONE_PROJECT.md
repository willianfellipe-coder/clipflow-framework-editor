# ClipFlow — Standalone AI Video Editor for Social Media

## Project Vision

**ClipFlow** is a local-first, AI-powered video editing framework specialized in creating optimized content for Instagram Reels and TikTok. It runs as a local web server with a rich browser-based UI — similar to how Antigravity (Google's IDE) and Remotion Studio serve their interfaces locally.

The core pipeline is: **Upload → Transcribe (WhisperX) → Analyze (Claude) → Edit (Remotion) → Export multi-format** — with a hybrid automation model where pre-configured templates per niche handle most decisions, but the user can override any step.

ClipFlow leverages **Claude Code's MCP (Model Context Protocol)** for AI integration, meaning it can authenticate via Claude Code's OAuth flow and expose its tools as an MCP server — making it usable both standalone AND as an extension inside any MCP-compatible IDE (Claude Code, Cursor, Windsurf).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ClipFlow Monorepo                        │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  @clip/   │  │  @clip/   │  │  @clip/    │  │   @clip/      │  │
│  │  app      │  │  server   │  │  remotion  │  │   shared      │  │
│  │          │  │          │  │           │  │              │  │
│  │ Vite     │  │ Fastify  │  │ Remotion  │  │ Types        │  │
│  │ React 19 │  │ Node 22  │  │ 4.x       │  │ Schemas      │  │
│  │ Tailwind │  │ SQLite   │  │ Templates │  │ Constants    │  │
│  │ shadcn   │  │ WebSocket│  │ Effects   │  │ Validators   │  │
│  │ Twick    │  │ FFmpeg   │  │ Captions  │  │              │  │
│  │          │  │ WhisperX │  │           │  │              │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│       │             │              │               │           │
│       └──────┬──────┘──────────────┘───────────────┘           │
│              │                                                  │
│     ┌────────┴────────┐                                        │
│     │   @clip/mcp     │  ← MCP Server (Claude Code / Cursor)  │
│     │   MCP Tools     │                                        │
│     │   OAuth 2.1     │                                        │
│     └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

### How It Runs

```bash
# Install
npx create-clipflow@latest my-project
cd my-project

# Start (opens browser automatically)
npm run dev
# → Server: http://localhost:4400
# → App:    http://localhost:4401
# → Studio: http://localhost:4402 (Remotion Studio)

# Or use as MCP tool from Claude Code
claude mcp add clipflow -- npx @clip/mcp
```

---

## Tech Stack Decision Matrix

| Layer | Technology | Why |
|-------|-----------|-----|
| **Monorepo** | pnpm workspaces + Turborepo | Fast installs, parallel builds, shared deps |
| **Frontend** | Vite 6 + React 19 + TypeScript 5.5 | Instant HMR, RSC-ready, no SSR overhead for local app |
| **UI Library** | Tailwind CSS 4 + shadcn/ui | Utility-first, copy-paste components, themeable |
| **Timeline** | Twick React SDK | Canvas-based timeline, multi-track, drag-and-drop, captions |
| **State** | Zustand 5 + Immer | Lightweight, no boilerplate, immutable updates |
| **Backend** | Fastify 5 + TypeScript | 2x faster than Express, schema validation, plugin ecosystem |
| **Database** | better-sqlite3 + Drizzle ORM | Zero-config, sync queries, type-safe migrations |
| **Real-time** | WebSocket (fastify-websocket) | Progress streaming, live preview sync |
| **Video Render** | Remotion 4.x | React-based compositions, Lambda support, Remotion Skills |
| **Transcription** | WhisperX (Python sidecar) | Word-level timestamps, forced alignment, speaker diarization |
| **Audio** | FFmpeg 7 (via ffmpeg-static) | Extract audio, probe metadata, concat, re-encode |
| **AI** | Claude API via MCP OAuth 2.1 | Analysis, scene planning, caption generation, creative decisions |
| **File Storage** | Local filesystem + organized dirs | No cloud dependency, fast I/O, user owns their data |
| **MCP Server** | @modelcontextprotocol/sdk | Expose ClipFlow as tool for Claude Code / Cursor / Windsurf |

---

## Project Structure

```
clipflow/
├── package.json                    # Root workspace config
├── pnpm-workspace.yaml
├── turbo.json                      # Turborepo pipeline
├── .env.example                    # API keys template
│
├── packages/
│   ├── app/                        # Frontend (Vite + React)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   └── MainLayout.tsx
│   │   │   │   ├── upload/
│   │   │   │   │   ├── DropZone.tsx
│   │   │   │   │   ├── UploadProgress.tsx
│   │   │   │   │   └── VideoMetadataCard.tsx
│   │   │   │   ├── timeline/
│   │   │   │   │   ├── TimelineEditor.tsx      # Twick integration
│   │   │   │   │   ├── TrackPanel.tsx
│   │   │   │   │   ├── WaveformTrack.tsx
│   │   │   │   │   ├── CaptionTrack.tsx
│   │   │   │   │   └── SceneMarkers.tsx
│   │   │   │   ├── preview/
│   │   │   │   │   ├── VideoPreview.tsx         # Remotion Player
│   │   │   │   │   ├── PreviewControls.tsx
│   │   │   │   │   └── SplitView.tsx
│   │   │   │   ├── captions/
│   │   │   │   │   ├── CaptionEditor.tsx
│   │   │   │   │   ├── CaptionStylePicker.tsx
│   │   │   │   │   ├── WordTimingAdjust.tsx
│   │   │   │   │   └── CaptionPresets.tsx
│   │   │   │   ├── templates/
│   │   │   │   │   ├── TemplateGallery.tsx
│   │   │   │   │   ├── TemplateCard.tsx
│   │   │   │   │   ├── TemplateEditor.tsx       # Visual drag-drop
│   │   │   │   │   └── NicheSelector.tsx
│   │   │   │   ├── export/
│   │   │   │   │   ├── ExportDialog.tsx
│   │   │   │   │   ├── FormatSelector.tsx
│   │   │   │   │   ├── QualitySettings.tsx
│   │   │   │   │   └── BatchExportPanel.tsx
│   │   │   │   ├── batch/
│   │   │   │   │   ├── BatchQueue.tsx
│   │   │   │   │   ├── BatchJobCard.tsx
│   │   │   │   │   └── BatchSettings.tsx
│   │   │   │   └── common/
│   │   │   │       ├── ProgressRing.tsx
│   │   │   │       ├── StatusBadge.tsx
│   │   │   │       └── KeyboardShortcuts.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Editor.tsx                   # Main editor view
│   │   │   │   ├── Templates.tsx
│   │   │   │   ├── BatchJobs.tsx
│   │   │   │   ├── Settings.tsx
│   │   │   │   └── History.tsx
│   │   │   ├── stores/
│   │   │   │   ├── projectStore.ts              # Current project state
│   │   │   │   ├── timelineStore.ts             # Tracks, clips, timing
│   │   │   │   ├── captionStore.ts              # Transcription + styled captions
│   │   │   │   ├── templateStore.ts             # Template library
│   │   │   │   ├── exportStore.ts               # Export settings + queue
│   │   │   │   ├── batchStore.ts                # Batch processing state
│   │   │   │   └── settingsStore.ts             # App preferences
│   │   │   ├── hooks/
│   │   │   │   ├── useWebSocket.ts              # Server connection
│   │   │   │   ├── useVideoPlayer.ts            # Playback controls
│   │   │   │   ├── useKeyboardShortcuts.ts
│   │   │   │   ├── useAutoSave.ts
│   │   │   │   └── useUndoRedo.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts                       # HTTP client
│   │   │   │   ├── ws.ts                        # WebSocket client
│   │   │   │   ├── remotion-player.ts           # Remotion Player config
│   │   │   │   └── format-utils.ts
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── server/                     # Backend (Fastify)
│   │   ├── src/
│   │   │   ├── index.ts                         # Server bootstrap + auto-open browser
│   │   │   ├── config.ts                        # Env loading, paths
│   │   │   ├── plugins/
│   │   │   │   ├── cors.ts
│   │   │   │   ├── websocket.ts
│   │   │   │   ├── static.ts                    # Serve frontend build
│   │   │   │   └── swagger.ts
│   │   │   ├── routes/
│   │   │   │   ├── projects.ts                  # CRUD projects
│   │   │   │   ├── upload.ts                    # Video upload + validation
│   │   │   │   ├── transcription.ts             # Whisper pipeline
│   │   │   │   ├── analysis.ts                  # Claude AI analysis
│   │   │   │   ├── scenes.ts                    # Scene plan CRUD
│   │   │   │   ├── captions.ts                  # Caption styling + timing
│   │   │   │   ├── templates.ts                 # Template CRUD
│   │   │   │   ├── render.ts                    # Remotion render trigger
│   │   │   │   ├── export.ts                    # Export + format conversion
│   │   │   │   ├── batch.ts                     # Batch job management
│   │   │   │   └── settings.ts                  # App settings
│   │   │   ├── services/
│   │   │   │   ├── ffmpeg.service.ts            # FFmpeg wrapper
│   │   │   │   ├── whisper.service.ts           # WhisperX Python sidecar
│   │   │   │   ├── claude.service.ts            # Claude API (via MCP or direct)
│   │   │   │   ├── remotion.service.ts          # Remotion render orchestration
│   │   │   │   ├── template.service.ts          # Template management
│   │   │   │   ├── batch.service.ts             # Batch queue processor
│   │   │   │   └── storage.service.ts           # File management
│   │   │   ├── db/
│   │   │   │   ├── schema.ts                    # Drizzle schema
│   │   │   │   ├── migrations/                  # Auto-generated migrations
│   │   │   │   └── seed.ts                      # Default templates + presets
│   │   │   ├── workers/
│   │   │   │   ├── transcription.worker.ts      # Background transcription
│   │   │   │   ├── render.worker.ts             # Background rendering
│   │   │   │   └── batch.worker.ts              # Batch processing loop
│   │   │   └── utils/
│   │   │       ├── logger.ts
│   │   │       ├── errors.ts
│   │   │       └── validators.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── remotion/                   # Remotion Compositions
│   │   ├── src/
│   │   │   ├── index.ts                         # Register all compositions
│   │   │   ├── Root.tsx                         # Remotion Root
│   │   │   ├── compositions/
│   │   │   │   ├── ReelComposition.tsx          # 9:16 vertical (Reels/TikTok)
│   │   │   │   ├── FeedComposition.tsx          # 1:1 / 4:5 feed posts
│   │   │   │   ├── StoryComposition.tsx         # 9:16 with story overlays
│   │   │   │   └── BaseComposition.tsx          # Abstract base
│   │   │   ├── components/
│   │   │   │   ├── AnimatedCaption.tsx          # Word-by-word highlight
│   │   │   │   ├── KaraokeCaption.tsx           # Karaoke-style reveal
│   │   │   │   ├── PopCaption.tsx               # Pop/bounce captions
│   │   │   │   ├── GlowCaption.tsx              # Neon glow effect
│   │   │   │   ├── Transition.tsx               # Scene transitions
│   │   │   │   ├── ProgressBar.tsx              # Video progress indicator
│   │   │   │   ├── Watermark.tsx                # Brand watermark
│   │   │   │   ├── BackgroundBlur.tsx           # Blurred BG for vertical
│   │   │   │   ├── ZoomEffect.tsx               # Ken Burns / zoom punch
│   │   │   │   ├── BRollOverlay.tsx             # B-roll cutaway
│   │   │   │   └── CallToAction.tsx             # End screen CTA
│   │   │   ├── templates/
│   │   │   │   ├── fitness/
│   │   │   │   │   ├── FitnessTemplate.tsx
│   │   │   │   │   └── fitness.config.json
│   │   │   │   ├── tech/
│   │   │   │   │   ├── TechTemplate.tsx
│   │   │   │   │   └── tech.config.json
│   │   │   │   ├── food/
│   │   │   │   │   ├── FoodTemplate.tsx
│   │   │   │   │   └── food.config.json
│   │   │   │   ├── education/
│   │   │   │   │   ├── EducationTemplate.tsx
│   │   │   │   │   └── education.config.json
│   │   │   │   ├── ecommerce/
│   │   │   │   │   ├── EcommerceTemplate.tsx
│   │   │   │   │   └── ecommerce.config.json
│   │   │   │   └── podcast/
│   │   │   │       ├── PodcastTemplate.tsx
│   │   │   │       └── podcast.config.json
│   │   │   ├── effects/
│   │   │   │   ├── shake.ts
│   │   │   │   ├── flash.ts
│   │   │   │   ├── colorGrade.ts
│   │   │   │   └── slowmo.ts
│   │   │   └── utils/
│   │   │       ├── timing.ts                    # Frame/time conversion
│   │   │       ├── easing.ts                    # Custom easing functions
│   │   │       └── fonts.ts                     # Font loading
│   │   ├── remotion.config.ts
│   │   └── package.json
│   │
│   ├── mcp/                        # MCP Server Package
│   │   ├── src/
│   │   │   ├── index.ts                         # MCP server entry
│   │   │   ├── tools/
│   │   │   │   ├── create-video.ts              # Full pipeline tool
│   │   │   │   ├── transcribe.ts                # Transcription tool
│   │   │   │   ├── analyze-video.ts             # Claude analysis tool
│   │   │   │   ├── apply-template.ts            # Apply template to video
│   │   │   │   ├── render.ts                    # Trigger render
│   │   │   │   ├── batch-process.ts             # Batch processing tool
│   │   │   │   └── list-templates.ts            # List available templates
│   │   │   └── auth/
│   │   │       └── oauth.ts                     # OAuth 2.1 + PKCE handler
│   │   └── package.json
│   │
│   └── shared/                     # Shared Types + Utilities
│       ├── src/
│       │   ├── types/
│       │   │   ├── project.ts
│       │   │   ├── video.ts
│       │   │   ├── transcription.ts
│       │   │   ├── scene.ts
│       │   │   ├── caption.ts
│       │   │   ├── template.ts
│       │   │   ├── export.ts
│       │   │   ├── batch.ts
│       │   │   └── websocket.ts
│       │   ├── schemas/                         # Zod validation schemas
│       │   │   ├── project.schema.ts
│       │   │   ├── video.schema.ts
│       │   │   └── template.schema.ts
│       │   └── constants/
│       │       ├── formats.ts                   # Platform specs (Reels, TikTok, etc.)
│       │       ├── presets.ts                    # Quality presets
│       │       └── niches.ts                    # Niche definitions
│       └── package.json
│
├── scripts/
│   ├── setup.sh                    # Install FFmpeg, Python, WhisperX
│   ├── dev.sh                      # Start all services
│   └── build.sh                    # Production build
│
├── whisper/                        # Python sidecar for WhisperX
│   ├── requirements.txt
│   ├── transcribe.py               # CLI: python transcribe.py <audio> <output>
│   └── README.md
│
└── data/                           # Local data (gitignored)
    ├── db/
    │   └── clipflow.db
    ├── uploads/                    # Raw uploaded videos
    ├── audio/                      # Extracted audio files
    ├── transcriptions/             # WhisperX JSON output
    ├── renders/                    # Rendered video output
    └── templates/                  # User-created templates
```

---

## Database Schema (Drizzle ORM + SQLite)

```typescript
// packages/server/src/db/schema.ts

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ── Projects ──────────────────────────────────────────────
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),                    // nanoid
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['draft', 'transcribing', 'analyzing', 'editing', 'rendering', 'done', 'error']
  }).notNull().default('draft'),
  sourceVideoPath: text('source_video_path').notNull(),
  sourceVideoMeta: text('source_video_meta'),     // JSON: duration, width, height, fps, codec
  thumbnailPath: text('thumbnail_path'),
  templateId: text('template_id').references(() => templates.id),
  nicheId: text('niche_id'),
  settings: text('settings'),                     // JSON: project-level overrides
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ── Transcriptions ────────────────────────────────────────
export const transcriptions = sqliteTable('transcriptions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  model: text('model').notNull().default('large-v3'),  // whisper model used
  language: text('language'),                           // detected language
  fullText: text('full_text').notNull(),
  wordTimestamps: text('word_timestamps').notNull(),    // JSON array of { word, start, end, confidence }
  segments: text('segments').notNull(),                 // JSON array of { text, start, end, speaker? }
  speakers: text('speakers'),                           // JSON: speaker diarization results
  duration: real('duration').notNull(),                 // audio duration in seconds
  processingTime: real('processing_time'),              // how long transcription took
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ── AI Analyses ───────────────────────────────────────────
export const analyses = sqliteTable('analyses', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  transcriptionId: text('transcription_id').notNull().references(() => transcriptions.id),
  model: text('model').notNull().default('claude-sonnet-4-6'),
  prompt: text('prompt').notNull(),                     // The prompt sent to Claude
  response: text('response').notNull(),                 // Full Claude response
  scenePlan: text('scene_plan').notNull(),              // JSON: structured scene breakdown
  suggestedCuts: text('suggested_cuts'),                // JSON: { start, end, reason }[]
  suggestedEffects: text('suggested_effects'),          // JSON: { timestamp, effect, reason }[]
  hookAnalysis: text('hook_analysis'),                  // JSON: hook quality score + suggestions
  ctaAnalysis: text('cta_analysis'),                    // JSON: CTA effectiveness + suggestions
  contentScore: integer('content_score'),               // 0-100 engagement prediction
  tokensUsed: integer('tokens_used'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ── Scene Plans ───────────────────────────────────────────
export const scenes = sqliteTable('scenes', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  analysisId: text('analysis_id').references(() => analyses.id),
  order: integer('order').notNull(),                    // Scene sequence number
  startTime: real('start_time').notNull(),              // Start in seconds
  endTime: real('end_time').notNull(),                  // End in seconds
  type: text('type', {
    enum: ['hook', 'content', 'transition', 'broll', 'cta', 'outro']
  }).notNull(),
  description: text('description'),
  captionText: text('caption_text'),                    // Override caption for this scene
  effects: text('effects'),                             // JSON: effects to apply
  zoomConfig: text('zoom_config'),                      // JSON: { scale, x, y, easing }
  transitionIn: text('transition_in'),                  // fade, slide, zoom, cut
  transitionOut: text('transition_out'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ── Captions ──────────────────────────────────────────────
export const captionStyles = sqliteTable('caption_styles', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),  // null = global preset
  name: text('name').notNull(),
  isPreset: integer('is_preset', { mode: 'boolean' }).notNull().default(false),
  fontFamily: text('font_family').notNull().default('Inter'),
  fontSize: integer('font_size').notNull().default(48),
  fontWeight: text('font_weight').notNull().default('800'),
  color: text('color').notNull().default('#FFFFFF'),
  highlightColor: text('highlight_color').notNull().default('#FFD700'),
  strokeColor: text('stroke_color').notNull().default('#000000'),
  strokeWidth: integer('stroke_width').notNull().default(4),
  backgroundColor: text('background_color'),            // Optional BG box
  backgroundPadding: integer('background_padding'),
  backgroundRadius: integer('background_radius'),
  position: text('position', {
    enum: ['top', 'center', 'bottom']
  }).notNull().default('bottom'),
  animation: text('animation', {
    enum: ['none', 'word-highlight', 'karaoke', 'pop', 'glow', 'typewriter', 'bounce']
  }).notNull().default('word-highlight'),
  maxWordsPerLine: integer('max_words_per_line').notNull().default(4),
  shadowConfig: text('shadow_config'),                  // JSON: { x, y, blur, color }
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ── Templates ─────────────────────────────────────────────
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  niche: text('niche').notNull(),                       // fitness, tech, food, education, etc.
  thumbnail: text('thumbnail'),                         // Preview image path
  isBuiltIn: integer('is_built_in', { mode: 'boolean' }).notNull().default(false),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),

  // Template configuration
  composition: text('composition').notNull(),           // Which Remotion composition to use
  defaultCaptionStyleId: text('default_caption_style_id').references(() => captionStyles.id),
  defaultEffects: text('default_effects'),              // JSON: default effects chain
  defaultTransitions: text('default_transitions'),      // JSON: default transition styles
  colorPalette: text('color_palette'),                  // JSON: brand colors
  musicConfig: text('music_config'),                    // JSON: { genre, mood, bpm }
  hookConfig: text('hook_config'),                      // JSON: hook treatment (text overlay, zoom, etc.)
  ctaConfig: text('cta_config'),                        // JSON: CTA end screen config
  layoutConfig: text('layout_config'),                  // JSON: element positions, sizes

  usageCount: integer('usage_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ── Renders ───────────────────────────────────────────────
export const renders = sqliteTable('renders', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  format: text('format', {
    enum: ['reel_9x16', 'tiktok_9x16', 'feed_1x1', 'feed_4x5', 'story_9x16']
  }).notNull(),
  status: text('status', {
    enum: ['queued', 'rendering', 'encoding', 'done', 'error']
  }).notNull().default('queued'),
  outputPath: text('output_path'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  fps: integer('fps').notNull().default(30),
  codec: text('codec').notNull().default('h264'),
  quality: text('quality', {
    enum: ['draft', 'standard', 'high', 'maximum']
  }).notNull().default('standard'),
  fileSize: integer('file_size'),                       // bytes
  renderTime: real('render_time'),                      // seconds
  progress: real('progress').notNull().default(0),      // 0-100
  errorMessage: text('error_message'),
  compositionProps: text('composition_props'),           // JSON: full props passed to Remotion
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// ── Batch Jobs ────────────────────────────────────────────
export const batchJobs = sqliteTable('batch_jobs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'paused', 'done', 'error']
  }).notNull().default('pending'),
  templateId: text('template_id').references(() => templates.id),
  captionStyleId: text('caption_style_id').references(() => captionStyles.id),
  formats: text('formats').notNull(),                   // JSON: format[] to export
  totalVideos: integer('total_videos').notNull(),
  completedVideos: integer('completed_videos').notNull().default(0),
  failedVideos: integer('failed_videos').notNull().default(0),
  settings: text('settings'),                           // JSON: batch-level overrides
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export const batchItems = sqliteTable('batch_items', {
  id: text('id').primaryKey(),
  batchJobId: text('batch_job_id').notNull().references(() => batchJobs.id),
  projectId: text('project_id').references(() => projects.id),
  sourceVideoPath: text('source_video_path').notNull(),
  status: text('status', {
    enum: ['pending', 'transcribing', 'analyzing', 'rendering', 'done', 'error']
  }).notNull().default('pending'),
  errorMessage: text('error_message'),
  order: integer('order').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ── Settings ──────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

---

## API Routes (Fastify)

### Projects
```
POST   /api/projects                    Create project (with video upload)
GET    /api/projects                    List projects (paginated, filterable)
GET    /api/projects/:id                Get project details + relations
PATCH  /api/projects/:id                Update project metadata
DELETE /api/projects/:id                Delete project + cleanup files
```

### Upload & Processing
```
POST   /api/upload                      Upload video file (multipart)
POST   /api/projects/:id/transcribe     Start WhisperX transcription
GET    /api/projects/:id/transcription  Get transcription result
POST   /api/projects/:id/analyze        Start Claude AI analysis
GET    /api/projects/:id/analysis       Get analysis result
```

### Scenes & Timeline
```
GET    /api/projects/:id/scenes         Get scene plan
PUT    /api/projects/:id/scenes         Replace scene plan (from AI or manual edit)
PATCH  /api/projects/:id/scenes/:sid    Update single scene
POST   /api/projects/:id/scenes/reorder Reorder scenes
POST   /api/projects/:id/scenes/auto-cut  AI-suggested silence removal
```

### Captions
```
GET    /api/projects/:id/captions       Get caption data
PUT    /api/projects/:id/captions       Update caption content/timing
GET    /api/caption-styles              List caption style presets
POST   /api/caption-styles              Create custom caption style
PATCH  /api/caption-styles/:id          Update caption style
```

### Templates
```
GET    /api/templates                   List all templates (built-in + custom)
GET    /api/templates/:id               Get template details
POST   /api/templates                   Create custom template
PATCH  /api/templates/:id               Update template
DELETE /api/templates/:id               Delete custom template
POST   /api/templates/:id/preview       Generate template preview
```

### Render & Export
```
POST   /api/projects/:id/render         Start Remotion render (single format)
POST   /api/projects/:id/render/multi   Render multiple formats simultaneously
GET    /api/renders/:id                 Get render status
GET    /api/renders/:id/download        Download rendered video
POST   /api/renders/:id/cancel          Cancel in-progress render
```

### Batch Processing
```
POST   /api/batch                       Create batch job (with video files)
GET    /api/batch                       List batch jobs
GET    /api/batch/:id                   Get batch job details
POST   /api/batch/:id/start             Start/resume batch processing
POST   /api/batch/:id/pause             Pause batch processing
DELETE /api/batch/:id                   Cancel and cleanup batch job
```

### Settings
```
GET    /api/settings                    Get all settings
PATCH  /api/settings                    Update settings
GET    /api/settings/system-check       Verify FFmpeg, WhisperX, etc.
```

### WebSocket Events
```
ws://localhost:4400/ws

Events (server → client):
  transcription:progress    { projectId, percent, currentSegment }
  transcription:complete    { projectId, transcriptionId }
  analysis:progress         { projectId, stage }
  analysis:complete         { projectId, analysisId }
  render:progress           { renderId, percent, currentFrame, totalFrames, eta }
  render:complete           { renderId, outputPath, fileSize }
  render:error              { renderId, error }
  batch:item:progress       { batchId, itemId, stage, percent }
  batch:item:complete       { batchId, itemId }
  batch:complete            { batchId, stats }
```

---

## Core Pipeline — Step by Step

### Stage 1: Upload & Probe

```typescript
// packages/server/src/services/ffmpeg.service.ts

export class FFmpegService {
  /**
   * Extract metadata from uploaded video
   */
  async probe(videoPath: string): Promise<VideoMeta> {
    // ffprobe -v quiet -print_format json -show_format -show_streams <path>
    // Returns: { duration, width, height, fps, codec, bitrate, audioCodec, audioRate }
  }

  /**
   * Extract audio track for WhisperX
   */
  async extractAudio(videoPath: string, outputPath: string): Promise<string> {
    // ffmpeg -i <video> -vn -acodec pcm_s16le -ar 16000 -ac 1 <output.wav>
    // WhisperX works best with 16kHz mono WAV
  }

  /**
   * Generate thumbnail at specific timestamp
   */
  async thumbnail(videoPath: string, timestamp: number, outputPath: string): Promise<string> {
    // ffmpeg -i <video> -ss <timestamp> -vframes 1 -q:v 2 <output.jpg>
  }

  /**
   * Re-encode for specific platform format
   */
  async reencode(inputPath: string, outputPath: string, config: ExportConfig): Promise<string> {
    // Platform-specific encoding: bitrate, resolution, codec settings
  }
}
```

### Stage 2: Transcription (WhisperX Python Sidecar)

```python
# whisper/transcribe.py
"""
Usage: python transcribe.py <audio_path> <output_path> [--model large-v3] [--language auto]

Outputs JSON with word-level timestamps and speaker diarization.
"""

import sys
import json
import whisperx

def transcribe(audio_path: str, output_path: str, model_name: str = "large-v3", language: str = None):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"

    # 1. Load model + transcribe
    model = whisperx.load_model(model_name, device, compute_type=compute_type)
    audio = whisperx.load_audio(audio_path)
    result = model.transcribe(audio, batch_size=16, language=language)

    # 2. Forced alignment for word-level timestamps
    model_a, metadata = whisperx.load_align_model(
        language_code=result["language"],
        device=device
    )
    result = whisperx.align(
        result["segments"],
        model_a, metadata, audio, device,
        return_char_alignments=False
    )

    # 3. Speaker diarization (optional, requires HuggingFace token)
    try:
        diarize_model = whisperx.DiarizationPipeline(device=device)
        diarize_segments = diarize_model(audio)
        result = whisperx.assign_word_speakers(diarize_segments, result)
    except Exception:
        pass  # Diarization is optional

    # 4. Output structured JSON
    output = {
        "language": result.get("language", language),
        "segments": result["segments"],
        "word_timestamps": [
            {
                "word": word["word"],
                "start": round(word["start"], 3),
                "end": round(word["end"], 3),
                "confidence": round(word.get("score", 0), 3),
                "speaker": word.get("speaker")
            }
            for segment in result["segments"]
            for word in segment.get("words", [])
        ]
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    return output
```

```typescript
// packages/server/src/services/whisper.service.ts

export class WhisperService {
  /**
   * Run WhisperX transcription as a child process.
   * Streams progress via WebSocket.
   */
  async transcribe(
    audioPath: string,
    projectId: string,
    options: { model?: string; language?: string }
  ): Promise<TranscriptionResult> {
    const outputPath = path.join(PATHS.transcriptions, `${projectId}.json`);

    const child = spawn('python', [
      path.join(PATHS.whisper, 'transcribe.py'),
      audioPath,
      outputPath,
      '--model', options.model || 'large-v3',
      ...(options.language ? ['--language', options.language] : [])
    ]);

    // Stream stdout for progress updates
    child.stderr.on('data', (data) => {
      const line = data.toString();
      // Parse whisperx progress output
      ws.broadcast(`transcription:progress`, { projectId, message: line });
    });

    await new Promise((resolve, reject) => {
      child.on('close', (code) => code === 0 ? resolve(null) : reject());
    });

    return JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  }
}
```

### Stage 3: AI Analysis (Claude)

```typescript
// packages/server/src/services/claude.service.ts

export class ClaudeService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Analyze transcription and generate scene plan, cuts, and effects.
   * This is the "brain" that turns raw transcription into an edit plan.
   */
  async analyzeForEdit(
    transcription: TranscriptionResult,
    template: Template | null,
    niche: string,
    userInstructions?: string
  ): Promise<AnalysisResult> {
    const systemPrompt = `You are ClipFlow, an expert social media video editor AI.
Your job is to analyze a video transcription and produce a detailed editing plan
optimized for maximum engagement on Instagram Reels and TikTok.

You understand:
- Hook theory: first 1-3 seconds must grab attention
- Pacing: social media videos need fast cuts (2-5 second scenes)
- Silence removal: dead air kills retention
- Caption timing: words must sync perfectly with speech
- CTA placement: end with clear call-to-action
- Platform-specific best practices (Reels vs TikTok nuances)

${template ? `TEMPLATE CONTEXT:\n${JSON.stringify(template.hookConfig)}\n${JSON.stringify(template.ctaConfig)}` : ''}
NICHE: ${niche}
${userInstructions ? `USER INSTRUCTIONS: ${userInstructions}` : ''}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Analyze this transcription and generate a complete edit plan.

TRANSCRIPTION:
${JSON.stringify(transcription.segments, null, 2)}

WORD TIMESTAMPS:
${JSON.stringify(transcription.word_timestamps, null, 2)}

Respond with this exact JSON structure:
{
  "scenes": [
    {
      "order": 1,
      "startTime": 0.0,
      "endTime": 2.5,
      "type": "hook",
      "description": "Opening hook — zoom in on speaker's face",
      "effects": ["zoom_punch"],
      "transitionIn": "cut",
      "transitionOut": "cut"
    }
  ],
  "suggestedCuts": [
    { "start": 5.2, "end": 6.8, "reason": "silence / filler word" }
  ],
  "suggestedEffects": [
    { "timestamp": 0.0, "effect": "zoom_punch", "reason": "create urgency on hook" }
  ],
  "hookAnalysis": {
    "score": 85,
    "currentHook": "first sentence text",
    "suggestion": "Consider starting with the key statistic for more impact"
  },
  "ctaAnalysis": {
    "score": 70,
    "hasCta": true,
    "suggestion": "Add text overlay CTA in last 3 seconds"
  },
  "contentScore": 82,
  "summary": "2-sentence summary of the video's content and target audience"
}`
      }]
    });

    return JSON.parse(response.content[0].text);
  }

  /**
   * Generate optimized caption text from raw transcription.
   * Cleans filler words, fixes grammar, maintains natural speech feel.
   */
  async optimizeCaptions(
    wordTimestamps: WordTimestamp[],
    style: 'verbatim' | 'clean' | 'punchy'
  ): Promise<OptimizedCaption[]> {
    // Claude cleans up filler words, adds emphasis markers, groups words
    // into visually balanced caption lines
  }

  /**
   * Generate copy/description for the post based on video content.
   */
  async generatePostCopy(
    transcription: TranscriptionResult,
    platform: 'instagram' | 'tiktok',
    niche: string
  ): Promise<PostCopy> {
    // Returns: { caption, hashtags, description, altText }
  }
}
```

### Stage 4: Remotion Rendering

```typescript
// packages/server/src/services/remotion.service.ts

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

export class RemotionService {
  private bundled: string | null = null;

  /**
   * Bundle Remotion project (cached after first run)
   */
  async ensureBundle(): Promise<string> {
    if (!this.bundled) {
      this.bundled = await bundle({
        entryPoint: path.join(PATHS.remotion, 'src/index.ts'),
        webpackOverride: (config) => config,
      });
    }
    return this.bundled;
  }

  /**
   * Render a video for a specific platform format.
   */
  async render(
    projectId: string,
    format: ExportFormat,
    props: CompositionProps,
    onProgress: (progress: RenderProgress) => void
  ): Promise<RenderResult> {
    const bundleLocation = await this.ensureBundle();
    const formatConfig = FORMAT_CONFIGS[format];

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: formatConfig.compositionId,
      inputProps: props,
    });

    const outputPath = path.join(
      PATHS.renders,
      `${projectId}_${format}_${Date.now()}.mp4`
    );

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: props,
      onProgress: ({ progress }) => {
        onProgress({
          percent: Math.round(progress * 100),
          currentFrame: Math.round(progress * composition.durationInFrames),
          totalFrames: composition.durationInFrames,
        });
      },
      // Performance tuning
      concurrency: Math.max(1, os.cpus().length - 1),
      chromiumOptions: { gl: 'angle' },
    });

    const stats = fs.statSync(outputPath);
    return {
      outputPath,
      fileSize: stats.size,
      width: formatConfig.width,
      height: formatConfig.height,
      duration: composition.durationInFrames / composition.fps,
    };
  }

  /**
   * Render multiple formats in parallel.
   */
  async renderMulti(
    projectId: string,
    formats: ExportFormat[],
    props: CompositionProps,
    onProgress: (format: string, progress: RenderProgress) => void
  ): Promise<Map<ExportFormat, RenderResult>> {
    const results = new Map();
    // Render sequentially to avoid memory issues (each render uses significant RAM)
    for (const format of formats) {
      const result = await this.render(
        projectId,
        format,
        { ...props, ...FORMAT_CONFIGS[format].propOverrides },
        (p) => onProgress(format, p)
      );
      results.set(format, result);
    }
    return results;
  }
}
```

### Remotion Composition Example

```tsx
// packages/remotion/src/compositions/ReelComposition.tsx

import { AbsoluteFill, Sequence, Video, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimatedCaption } from '../components/AnimatedCaption';
import { ZoomEffect } from '../components/ZoomEffect';
import { Transition } from '../components/Transition';
import { CallToAction } from '../components/CallToAction';
import { ProgressBar } from '../components/ProgressBar';

export interface ReelProps {
  videoSrc: string;
  scenes: Scene[];
  captions: Caption[];
  captionStyle: CaptionStyleConfig;
  effects: EffectConfig[];
  cta?: CTAConfig;
  showProgressBar?: boolean;
  watermark?: WatermarkConfig;
}

export const ReelComposition: React.FC<ReelProps> = ({
  videoSrc,
  scenes,
  captions,
  captionStyle,
  effects,
  cta,
  showProgressBar = true,
  watermark,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentTime = frame / fps;

  // Find active scene
  const activeScene = scenes.find(
    s => currentTime >= s.startTime && currentTime < s.endTime
  );

  // Find active captions (can show multiple words)
  const activeCaptions = captions.filter(
    c => currentTime >= c.startTime && currentTime < c.endTime
  );

  // Find active effects
  const activeEffects = effects.filter(
    e => currentTime >= e.startTime && currentTime < e.endTime
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Base video layer */}
      {scenes.map((scene, i) => (
        <Sequence
          key={scene.id}
          from={Math.round(scene.startTime * fps)}
          durationInFrames={Math.round((scene.endTime - scene.startTime) * fps)}
        >
          <Transition type={scene.transitionIn} duration={0.3}>
            <ZoomEffect config={scene.zoomConfig}>
              <Video
                src={videoSrc}
                startFrom={Math.round(scene.startTime * fps)}
                endAt={Math.round(scene.endTime * fps)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </ZoomEffect>
          </Transition>
        </Sequence>
      ))}

      {/* Caption layer */}
      <AbsoluteFill>
        <AnimatedCaption
          captions={activeCaptions}
          style={captionStyle}
          currentTime={currentTime}
        />
      </AbsoluteFill>

      {/* Progress bar */}
      {showProgressBar && (
        <ProgressBar progress={frame / durationInFrames} />
      )}

      {/* CTA end screen */}
      {cta && (
        <Sequence
          from={durationInFrames - Math.round(cta.duration * fps)}
          durationInFrames={Math.round(cta.duration * fps)}
        >
          <CallToAction config={cta} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
```

---

## MCP Server — Claude Code / Cursor Integration

```typescript
// packages/mcp/src/index.ts

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'clipflow',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  }
});

// ── Tool: Create Video ────────────────────────────────────
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'clipflow_create_video',
      description: 'Create an edited social media video from a source video file. ' +
        'Runs the full pipeline: transcribe → analyze → apply template → render. ' +
        'Returns paths to rendered videos in requested formats.',
      inputSchema: {
        type: 'object',
        properties: {
          video_path: {
            type: 'string',
            description: 'Absolute path to the source video file'
          },
          template: {
            type: 'string',
            description: 'Template name or ID (e.g., "fitness", "tech", "podcast")',
            default: 'auto'
          },
          formats: {
            type: 'array',
            items: { type: 'string', enum: ['reel_9x16', 'tiktok_9x16', 'feed_1x1', 'feed_4x5'] },
            description: 'Output formats to render',
            default: ['reel_9x16', 'tiktok_9x16']
          },
          caption_style: {
            type: 'string',
            enum: ['word-highlight', 'karaoke', 'pop', 'glow', 'none'],
            default: 'word-highlight'
          },
          instructions: {
            type: 'string',
            description: 'Optional natural language editing instructions'
          }
        },
        required: ['video_path']
      }
    },
    {
      name: 'clipflow_transcribe',
      description: 'Transcribe a video/audio file with word-level timestamps',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
          language: { type: 'string', default: 'auto' }
        },
        required: ['file_path']
      }
    },
    {
      name: 'clipflow_list_templates',
      description: 'List all available video editing templates',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'clipflow_batch_process',
      description: 'Process multiple videos with the same template and settings',
      inputSchema: {
        type: 'object',
        properties: {
          video_paths: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of video file paths'
          },
          template: { type: 'string' },
          formats: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['video_paths']
      }
    },
    {
      name: 'clipflow_analyze_video',
      description: 'Analyze a video and return AI insights: engagement score, hook quality, ' +
        'suggested cuts, and recommended effects',
      inputSchema: {
        type: 'object',
        properties: {
          video_path: { type: 'string' },
          niche: { type: 'string', default: 'general' }
        },
        required: ['video_path']
      }
    }
  ]
}));

// ── Tool execution ────────────────────────────────────────
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'clipflow_create_video': {
      // Call ClipFlow server API
      const response = await fetch('http://localhost:4400/api/mcp/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      const result = await response.json();
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    // ... other tool handlers
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### MCP Configuration for Claude Code

```json
// ~/.claude/mcp.json (user adds this)
{
  "mcpServers": {
    "clipflow": {
      "command": "npx",
      "args": ["@clip/mcp"],
      "env": {
        "CLIPFLOW_PORT": "4400",
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

### Usage from Claude Code

```
> claude "Take the video /Users/me/raw-footage.mp4 and create an Instagram Reel
  with karaoke-style captions. Use the tech template."

Claude Code → calls clipflow_create_video tool →
  ClipFlow server processes the full pipeline →
  Returns: { renders: ["/path/to/output_reel_9x16.mp4"] }
```

---

## Platform Format Specifications

```typescript
// packages/shared/src/constants/formats.ts

export const FORMAT_CONFIGS = {
  reel_9x16: {
    compositionId: 'ReelComposition',
    width: 1080,
    height: 1920,
    fps: 30,
    maxDuration: 90,       // Instagram Reels max: 90 seconds
    codec: 'h264',
    bitrate: '8M',
    audioBitrate: '192k',
    propOverrides: {},
    platform: 'instagram',
  },
  tiktok_9x16: {
    compositionId: 'ReelComposition',     // Same composition, different config
    width: 1080,
    height: 1920,
    fps: 30,
    maxDuration: 180,      // TikTok allows up to 10 min but 3 min is optimal
    codec: 'h264',
    bitrate: '6M',
    audioBitrate: '128k',
    propOverrides: {
      showProgressBar: false,             // TikTok has its own
    },
    platform: 'tiktok',
  },
  feed_1x1: {
    compositionId: 'FeedComposition',
    width: 1080,
    height: 1080,
    fps: 30,
    maxDuration: 60,
    codec: 'h264',
    bitrate: '6M',
    audioBitrate: '192k',
    propOverrides: {
      letterbox: true,
    },
    platform: 'instagram',
  },
  feed_4x5: {
    compositionId: 'FeedComposition',
    width: 1080,
    height: 1350,
    fps: 30,
    maxDuration: 60,
    codec: 'h264',
    bitrate: '7M',
    audioBitrate: '192k',
    propOverrides: {},
    platform: 'instagram',
  },
  story_9x16: {
    compositionId: 'StoryComposition',
    width: 1080,
    height: 1920,
    fps: 30,
    maxDuration: 60,       // Stories: 60s max per segment
    codec: 'h264',
    bitrate: '6M',
    audioBitrate: '128k',
    propOverrides: {
      safeAreaTop: 120,                   // Space for story UI elements
      safeAreaBottom: 200,
    },
    platform: 'instagram',
  },
} as const;

export type ExportFormat = keyof typeof FORMAT_CONFIGS;
```

---

## Niche Template System

```typescript
// packages/shared/src/constants/niches.ts

export const NICHES = {
  fitness: {
    id: 'fitness',
    name: 'Fitness & Health',
    icon: '💪',
    defaultEffects: ['zoom_punch', 'flash_on_beat'],
    defaultTransitions: ['cut', 'whip_pan'],
    captionStyle: 'pop',                           // Bold, energetic captions
    pacing: 'fast',                                // 2-3s per scene
    hookStrategy: 'before_after',                  // Show result first
    ctaStyle: 'follow_for_more',
    colorPalette: ['#FF6B35', '#004E89', '#FFFFFF'],
    musicMood: 'energetic',
  },
  tech: {
    id: 'tech',
    name: 'Tech & SaaS',
    icon: '💻',
    defaultEffects: ['screen_zoom', 'cursor_highlight'],
    defaultTransitions: ['slide', 'morph'],
    captionStyle: 'word-highlight',
    pacing: 'medium',                              // 3-5s per scene
    hookStrategy: 'problem_statement',             // "Are you still doing X manually?"
    ctaStyle: 'link_in_bio',
    colorPalette: ['#6366F1', '#0F172A', '#F8FAFC'],
    musicMood: 'ambient',
  },
  food: {
    id: 'food',
    name: 'Food & Recipe',
    icon: '🍳',
    defaultEffects: ['slow_zoom', 'warm_grade'],
    defaultTransitions: ['dissolve', 'cut'],
    captionStyle: 'karaoke',
    pacing: 'medium',
    hookStrategy: 'end_result_first',              // Show the finished dish
    ctaStyle: 'save_recipe',
    colorPalette: ['#F59E0B', '#78350F', '#FFF7ED'],
    musicMood: 'upbeat_acoustic',
  },
  education: {
    id: 'education',
    name: 'Education & Tutorial',
    icon: '📚',
    defaultEffects: ['text_callout', 'arrow_annotation'],
    defaultTransitions: ['slide', 'fade'],
    captionStyle: 'word-highlight',
    pacing: 'slow',                                // 4-6s per scene
    hookStrategy: 'curiosity_gap',                 // "Most people don't know this..."
    ctaStyle: 'follow_for_tips',
    colorPalette: ['#10B981', '#1E293B', '#F0FDF4'],
    musicMood: 'calm',
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce & Product',
    icon: '🛍️',
    defaultEffects: ['product_spotlight', 'price_flash'],
    defaultTransitions: ['zoom', 'slide'],
    captionStyle: 'glow',
    pacing: 'fast',
    hookStrategy: 'urgency',                       // "Limited time" / "Last units"
    ctaStyle: 'shop_now',
    colorPalette: ['#EC4899', '#18181B', '#FDF2F8'],
    musicMood: 'trendy',
  },
  podcast: {
    id: 'podcast',
    name: 'Podcast & Talking Head',
    icon: '🎙️',
    defaultEffects: ['speaker_zoom', 'waveform_bg'],
    defaultTransitions: ['cut'],
    captionStyle: 'word-highlight',
    pacing: 'dynamic',                             // AI-determined based on speech
    hookStrategy: 'controversial_quote',           // Pull the most engaging 3s
    ctaStyle: 'full_episode_link',
    colorPalette: ['#8B5CF6', '#0F0F0F', '#F5F3FF'],
    musicMood: 'none',                             // Podcast typically no music
  },
} as const;

export type NicheId = keyof typeof NICHES;
```

---

## Frontend UI — Key Screens

### 1. Dashboard (`/`)
```
┌─────────────────────────────────────────────────────────────┐
│  ClipFlow                              [Settings] [Theme]    │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ ▸ New    │  Recent Projects                                  │
│          │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│ ▸ Templ. │  │ 🎬   │ │ 🎬   │ │ 🎬   │ │ 🎬   │            │
│          │  │thumb │ │thumb │ │thumb │ │thumb │            │
│ ▸ Batch  │  │      │ │      │ │      │ │      │            │
│          │  │Status│ │Status│ │Status│ │Status│            │
│ ▸ Hist.  │  └──────┘ └──────┘ └──────┘ └──────┘            │
│          │                                                   │
│ ▸ Sett.  │  Quick Start                                      │
│          │  ┌─────────────────────────────────────────┐      │
│          │  │                                         │      │
│          │  │     Drop video here or click to upload  │      │
│          │  │     Supports: MP4, MOV, WebM, AVI       │      │
│          │  │                                         │      │
│          │  └─────────────────────────────────────────┘      │
│          │                                                   │
│          │  Batch Processing: Drop multiple files...          │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

### 2. Editor (`/editor/:projectId`)
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back    Project Name         [Undo] [Redo] [Export ▾]    │
├──────────┬────────────────────────────┬─────────────────────┤
│ Scenes   │    Video Preview            │  Properties         │
│          │    ┌───────────────────┐    │                     │
│ [Hook]   │    │                   │    │  Scene: Hook        │
│  0-2.5s  │    │    9:16 Preview   │    │  Start: 0.00s       │
│          │    │    (Remotion      │    │  End:   2.50s       │
│ [Content]│    │     Player)       │    │  Type: ▾ hook       │
│  2.5-15s │    │                   │    │                     │
│          │    │                   │    │  Effects:           │
│ [Trans.] │    │                   │    │  ☑ zoom_punch       │
│  15-15.5s│    │                   │    │  ☐ flash            │
│          │    └───────────────────┘    │  ☐ slow_mo          │
│ [Content]│    [⏮] [⏯] [⏭] 0:02/0:45  │                     │
│  15.5-40s│                             │  Transition In: cut │
│          │                             │  Transition Out: ▾  │
│ [CTA]    │                             │                     │
│  40-45s  │    Caption Style            │  Caption Override:  │
│          │    [Word-HL] [Karaoke]      │  [                ] │
│ + Add    │    [Pop] [Glow] [Custom]    │                     │
│          │                             │  Zoom Config:       │
├──────────┴─────────────────────────────┤  Scale: [1.2]       │
│  Timeline (Twick)                       │  X: [50%] Y: [40%] │
│  ┌─────────────────────────────────────┐│                     │
│  │ 🎬 Video  [====][====][==][======]  ││                     │
│  │ 🎤 Audio  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿  ││                     │
│  │ 💬 Captions [Hi][there][how][are]   ││                     │
│  │ ✨ Effects  [zoom] [flash]  [glow]  ││                     │
│  │ 🔀 Scenes  [hook][content][cta]     ││                     │
│  └─────────────────────────────────────┘│                     │
│  0s     10s     20s     30s     40s 45s │                     │
└─────────────────────────────────────────┴─────────────────────┘
```

### 3. Template Editor (`/templates/:id/edit`)
```
┌─────────────────────────────────────────────────────────────┐
│  ← Templates    "Fitness Banger"     [Preview] [Save]       │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ Elements │  Visual Template Builder                          │
│          │  ┌───────────────────────────────────┐            │
│ [Text]   │  │  ┌─────────────────────────┐      │            │
│ [Image]  │  │  │  {video}                │      │            │
│ [Shape]  │  │  │                         │      │            │
│ [Effect] │  │  │                         │      │            │
│ [CTA]    │  │  │  ┌───────────────┐      │      │            │
│          │  │  │  │ {captions}    │      │      │            │
│ Settings │  │  │  └───────────────┘      │      │            │
│          │  │  │         [progress_bar]   │      │            │
│ Niche:   │  │  └─────────────────────────┘      │            │
│ [Fitness]│  └───────────────────────────────────┘            │
│          │                                                   │
│ Colors:  │  Template Config                                  │
│ [■][■][■]│  Hook: ▾ before_after    CTA: ▾ follow_for_more  │
│          │  Pacing: ▾ fast          Music: ▾ energetic       │
│ Caption: │  Captions: ▾ pop         Transitions: ▾ whip_pan  │
│ [Pop ▾]  │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

### 4. Batch Processing (`/batch`)
```
┌─────────────────────────────────────────────────────────────┐
│  Batch Processing                    [+ New Batch]           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Active Batch: "Weekly Content — March 2026"                 │
│  Template: Tech Review  │  Formats: Reel + TikTok           │
│  Caption Style: Word-Highlight                               │
│                                                              │
│  ┌─────┬──────────────────┬────────┬──────────┬──────────┐  │
│  │  #  │ Video             │ Status │ Progress │ Actions  │  │
│  ├─────┼──────────────────┼────────┼──────────┼──────────┤  │
│  │  1  │ product-demo.mp4  │ ✅ Done│ ████████ │ [View]   │  │
│  │  2  │ tutorial-01.mp4   │ 🔄 Rend│ █████░░░ │ [View]   │  │
│  │  3  │ interview.mp4     │ 🧠 AI  │ ██░░░░░░ │ [View]   │  │
│  │  4  │ unboxing.mp4      │ ⏳ Queue│ ░░░░░░░░ │ [Skip]   │  │
│  │  5  │ review-final.mp4  │ ⏳ Queue│ ░░░░░░░░ │ [Skip]   │  │
│  └─────┴──────────────────┴────────┴──────────┴──────────┘  │
│                                                              │
│  Total: 5 videos  │  Done: 1  │  Processing: 2  │  Queue: 2│
│  Estimated time remaining: ~12 minutes                       │
│                                      [Pause All] [Cancel]    │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan — 8 Phases

### Phase 1: Foundation (Week 1)
**Monorepo + DB + Server + Basic UI Shell**

```
CLAUDE CODE PROMPT — Phase 1:

You are building ClipFlow, a standalone video editor for social media.
Initialize the monorepo with pnpm workspaces + Turborepo.

1. Create root package.json with workspaces: ["packages/*"]
2. Create turbo.json with build/dev/lint pipelines
3. Create packages/shared/ with TypeScript types for:
   - Project, Video, Transcription, Scene, Caption, Template, Export, Batch
   - Zod schemas for validation
   - Format constants (reel_9x16, tiktok_9x16, feed_1x1, feed_4x5, story_9x16)
   - Niche definitions (fitness, tech, food, education, ecommerce, podcast)

4. Create packages/server/ with Fastify 5:
   - Database schema using Drizzle ORM + better-sqlite3
   - Tables: projects, transcriptions, analyses, scenes, caption_styles,
     templates, renders, batch_jobs, batch_items, settings
   - All routes stubbed with proper TypeScript types
   - WebSocket plugin for real-time events
   - Auto-open browser on startup (import open from 'open')
   - CORS configured for localhost:4401

5. Create packages/app/ with Vite 6 + React 19:
   - Tailwind CSS 4 + shadcn/ui setup
   - React Router with pages: Dashboard, Editor, Templates, Batch, Settings, History
   - Zustand stores: project, timeline, caption, template, export, batch, settings
   - MainLayout with sidebar navigation
   - Dark theme as default

6. Run: pnpm install && pnpm dev should start both server and app

Files to create: ~40 files
Checklist:
- [ ] pnpm dev starts server on :4400 and app on :4401
- [ ] Database creates tables on first run
- [ ] API routes return proper TypeScript typed responses
- [ ] Frontend renders shell with navigation
- [ ] WebSocket connection established between app and server
```

### Phase 2: Upload + FFmpeg + Transcription (Week 2)
**Video upload, probe, audio extraction, WhisperX integration**

```
CLAUDE CODE PROMPT — Phase 2:

Continue building ClipFlow. Phase 2: Upload + Transcription pipeline.

1. packages/server/src/services/ffmpeg.service.ts:
   - probe(videoPath): extract metadata via ffprobe (duration, resolution, fps, codec)
   - extractAudio(videoPath, outputPath): extract 16kHz mono WAV for WhisperX
   - thumbnail(videoPath, timestamp, outputPath): extract frame as JPEG
   - Use ffmpeg-static and ffprobe-static npm packages

2. packages/server/src/routes/upload.ts:
   - POST /api/upload: multipart file upload with @fastify/multipart
   - Validate: file size (max 500MB), mime type (video/*)
   - Save to data/uploads/{projectId}/original.{ext}
   - Auto-probe metadata after upload
   - Generate thumbnail at 25% of duration
   - Create project record in DB

3. whisper/transcribe.py:
   - Python script using WhisperX
   - Input: audio WAV path, output JSON path
   - Output: { language, segments[], word_timestamps[] }
   - Each word_timestamp: { word, start, end, confidence, speaker? }
   - Include speaker diarization when HF_TOKEN is available

4. packages/server/src/services/whisper.service.ts:
   - Spawn Python child process
   - Stream progress via WebSocket
   - Parse output JSON into TypeScript types
   - Save transcription to DB

5. packages/server/src/routes/transcription.ts:
   - POST /api/projects/:id/transcribe — trigger transcription
   - GET /api/projects/:id/transcription — get result

6. packages/app/src/components/upload/DropZone.tsx:
   - Drag-and-drop + click-to-upload
   - Upload progress bar
   - After upload: show video metadata card
   - "Transcribe" button triggers transcription
   - Live transcription progress from WebSocket

7. scripts/setup.sh:
   - Check FFmpeg installation
   - Create Python venv in whisper/
   - pip install whisperx torch
   - Verify everything works

Checklist:
- [ ] Can upload video via DropZone
- [ ] FFmpeg extracts metadata and thumbnail
- [ ] Audio extraction produces 16kHz WAV
- [ ] WhisperX transcribes with word-level timestamps
- [ ] WebSocket streams transcription progress to frontend
- [ ] Transcription result saved to DB and displayed in UI
```

### Phase 3: Claude AI Analysis (Week 3)
**AI-powered scene detection, cut suggestions, engagement analysis**

```
CLAUDE CODE PROMPT — Phase 3:

Continue building ClipFlow. Phase 3: Claude AI integration.

1. packages/server/src/services/claude.service.ts:
   - Constructor accepts API key (from env or MCP OAuth)
   - analyzeForEdit(transcription, template, niche, userInstructions):
     * Send transcription segments + word timestamps to Claude
     * System prompt with social media editing expertise
     * Return: scenes[], suggestedCuts[], suggestedEffects[],
       hookAnalysis, ctaAnalysis, contentScore
   - optimizeCaptions(wordTimestamps, style):
     * Clean filler words ("um", "uh", "like", "you know")
     * Fix grammar while keeping speech natural
     * Group words into balanced caption lines (max 4 words/line)
   - generatePostCopy(transcription, platform, niche):
     * Generate caption, hashtags, description for Instagram/TikTok

2. packages/server/src/routes/analysis.ts:
   - POST /api/projects/:id/analyze
     * Requires transcription to exist
     * Accepts: { niche, templateId?, instructions? }
     * Calls Claude, saves analysis + auto-generates scene plan
   - GET /api/projects/:id/analysis

3. packages/server/src/routes/scenes.ts:
   - GET /api/projects/:id/scenes — scene plan from analysis
   - PUT /api/projects/:id/scenes — replace entire plan
   - PATCH /api/projects/:id/scenes/:sid — update single scene
   - POST /api/projects/:id/scenes/reorder
   - POST /api/projects/:id/scenes/auto-cut — AI re-analysis

4. Frontend updates:
   - After transcription complete, show "Analyze with AI" button
   - Analysis progress indicator (stage: "analyzing hook", "planning scenes", etc.)
   - Scene panel in Editor sidebar showing generated scenes
   - Each scene card: type badge, time range, description, effects
   - Drag to reorder scenes
   - Click scene to seek preview to that point
   - Edit scene properties in right panel

5. Analysis prompt engineering:
   - Include niche-specific context from NICHES config
   - If template provided, include template's hook/cta/pacing config
   - Ask Claude to identify the single most engaging 3-second clip for the hook
   - Ask for silence detection (>0.5s gaps)
   - Ask for engagement score prediction (0-100)

Checklist:
- [ ] Claude API calls work with proper error handling
- [ ] Analysis generates coherent scene plan from transcription
- [ ] Scenes display in editor sidebar
- [ ] Can reorder/edit/delete scenes manually
- [ ] Suggested cuts highlight silence/filler sections
- [ ] Content score and hook analysis display correctly
```

### Phase 4: Remotion Compositions + Preview (Week 4)
**Remotion compositions, caption components, live preview in editor**

```
CLAUDE CODE PROMPT — Phase 4:

Continue building ClipFlow. Phase 4: Remotion compositions and live preview.

1. packages/remotion/ setup:
   - Initialize with Remotion 4.x
   - remotion.config.ts with webpack config
   - Root.tsx registering all compositions

2. Compositions:
   - ReelComposition.tsx (9:16) — primary for Reels/TikTok
   - FeedComposition.tsx (1:1 and 4:5 with letterboxing)
   - StoryComposition.tsx (9:16 with safe areas)
   - BaseComposition.tsx — shared logic

3. Caption components (the star of the show):
   - AnimatedCaption.tsx — word-by-word highlight (active word changes color)
   - KaraokeCaption.tsx — progressive fill reveal left-to-right
   - PopCaption.tsx — each word pops/bounces in with spring animation
   - GlowCaption.tsx — neon glow effect on active word
   - All receive: captions[], captionStyle, currentTime
   - All use interpolate() for smooth animations
   - Support configurable: font, size, color, highlight color, stroke, position

4. Effect components:
   - ZoomEffect.tsx — Ken Burns style pan/zoom using interpolate()
   - Transition.tsx — fade, slide, whip_pan, dissolve, zoom transitions
   - ProgressBar.tsx — thin bar at bottom showing video progress
   - BackgroundBlur.tsx — blurred version of video for vertical formatting
   - CallToAction.tsx — end screen with text + optional button graphic

5. Live preview in Editor:
   - Install @remotion/player in packages/app
   - VideoPreview.tsx wraps <Player> component
   - Passes current project's scenes, captions, effects as props
   - Syncs playback position with timeline (Twick)
   - Format toggle: preview as Reel / TikTok / Feed / Story
   - Split view: original vs edited side-by-side

6. packages/remotion/src/utils/:
   - timing.ts: seconds↔frames conversion, scene frame ranges
   - easing.ts: custom easing functions (bounceOut, elasticOut, etc.)
   - fonts.ts: @remotion/google-fonts integration

Checklist:
- [ ] Remotion Studio opens on :4402 with all compositions
- [ ] Caption animations render correctly in all 4 styles
- [ ] Live preview in editor updates when scenes/captions change
- [ ] Format toggle shows correct aspect ratio
- [ ] Transitions between scenes render smoothly
- [ ] ZoomEffect interpolates correctly with configurable easing
```

### Phase 5: Timeline + Caption Editor (Week 5)
**Twick timeline integration, caption editing UI, waveform display**

```
CLAUDE CODE PROMPT — Phase 5:

Continue building ClipFlow. Phase 5: Timeline and caption editing.

1. Timeline (Twick React SDK integration):
   - packages/app/src/components/timeline/TimelineEditor.tsx
   - Initialize Twick with tracks:
     * Video track: scene segments as draggable clips
     * Audio track: waveform visualization
     * Caption track: word blocks synchronized to speech
     * Effects track: effect indicators at timestamps
     * Scene markers track: colored markers for scene boundaries
   - Drag clips to reorder within tracks
   - Drag clip edges to trim start/end times
   - Click empty space to add new elements
   - Playhead syncs with Remotion Player

2. Caption Editor:
   - CaptionEditor.tsx: inline editing of caption text
   - WordTimingAdjust.tsx: fine-tune individual word start/end times
   - CaptionStylePicker.tsx: visual picker for animation style
     * Show mini preview of each style (word-highlight, karaoke, pop, glow)
   - CaptionPresets.tsx: save/load caption style presets

3. Waveform display:
   - Use wavesurfer.js in WaveformTrack.tsx
   - Show audio amplitude aligned with timeline
   - Highlight speech vs silence regions
   - Color-code by speaker (if diarization available)

4. Scene editing on timeline:
   - SceneMarkers.tsx: colored markers at scene boundaries
   - Drag markers to adjust scene timing
   - Double-click between markers to split scene
   - Right-click context menu: split, merge, delete, change type

5. Keyboard shortcuts:
   - Space: play/pause
   - J/K/L: shuttle backward/pause/forward
   - I/O: set in/out points
   - Ctrl+Z/Y: undo/redo
   - S: split at playhead
   - Delete: remove selected element

6. Undo/Redo system:
   - useUndoRedo.ts hook with immer patches
   - Track changes to: scenes, captions, effects, timing
   - Ctrl+Z undoes last change, Ctrl+Y redoes

Checklist:
- [ ] Twick timeline renders all 5 tracks
- [ ] Can drag-trim clips on video track
- [ ] Waveform displays and aligns with audio
- [ ] Caption editor allows inline text editing
- [ ] Word timing can be adjusted per-word
- [ ] Caption style picker shows live previews
- [ ] Keyboard shortcuts work globally
- [ ] Undo/redo works across all edit operations
```

### Phase 6: Template Engine (Week 6)
**Visual template builder, niche presets, template gallery**

```
CLAUDE CODE PROMPT — Phase 6:

Continue building ClipFlow. Phase 6: Template system.

1. Template Gallery page:
   - TemplateGallery.tsx: grid of template cards
   - TemplateCard.tsx: thumbnail, name, niche badge, usage count
   - NicheSelector.tsx: filter by niche (fitness, tech, food, etc.)
   - Built-in templates seeded on first run
   - "Create Custom" button → TemplateEditor

2. Template Editor (visual builder):
   - TemplateEditor.tsx: drag-and-drop layout builder
   - Canvas area showing 9:16 preview with placeholders:
     * {video} — where the source video goes
     * {captions} — where captions render
     * {progress_bar} — position of progress indicator
     * {watermark} — brand logo position
     * {cta} — call-to-action area
   - Drag elements to reposition
   - Config panel for each element (size, style, animation)

3. Template configuration:
   - Hook treatment: select strategy (before_after, problem_statement, etc.)
   - CTA config: style, text, duration, animation
   - Pacing: fast (2-3s), medium (3-5s), slow (4-6s), dynamic (AI-chosen)
   - Default caption style: picker from available styles
   - Default effects: multi-select from available effects
   - Transition style: default transition between scenes
   - Color palette: 3-color picker that applies to captions/overlays
   - Music mood: selector (feeds into future music suggestion feature)

4. Built-in templates (create 6):
   - packages/remotion/src/templates/fitness/FitnessTemplate.tsx
   - packages/remotion/src/templates/tech/TechTemplate.tsx
   - packages/remotion/src/templates/food/FoodTemplate.tsx
   - packages/remotion/src/templates/education/EducationTemplate.tsx
   - packages/remotion/src/templates/ecommerce/EcommerceTemplate.tsx
   - packages/remotion/src/templates/podcast/PodcastTemplate.tsx
   - Each template has its own React composition + config.json

5. Template application to project:
   - When user selects template for a project:
     * Apply default caption style
     * Apply default effects to all scenes
     * Apply default transitions
     * Update Remotion composition reference
     * Re-render preview

6. Backend:
   - Template CRUD routes (list, get, create, update, delete)
   - Seed built-in templates via db/seed.ts
   - Template preview generation (render 3-second sample)

Checklist:
- [ ] Template gallery shows 6 built-in templates
- [ ] Can filter by niche
- [ ] Template editor allows visual layout customization
- [ ] Applying template to project updates all defaults
- [ ] Custom templates persist in DB
- [ ] Template preview renders correctly
```

### Phase 7: Render + Multi-format Export (Week 7)
**Remotion rendering, format conversion, quality settings, download**

```
CLAUDE CODE PROMPT — Phase 7:

Continue building ClipFlow. Phase 7: Rendering and export.

1. packages/server/src/services/remotion.service.ts:
   - ensureBundle(): cache Remotion webpack bundle
   - render(projectId, format, props, onProgress):
     * Select composition based on format
     * Build full compositionProps from project data:
       - Source video path (served via static files)
       - Scene plan with timing
       - Caption data with word timestamps
       - Caption style config
       - Effects config
       - Template overrides
     * Call renderMedia() with progress callback
     * Stream progress via WebSocket
   - renderMulti(): render multiple formats sequentially

2. Export configuration UI:
   - ExportDialog.tsx: modal with export settings
   - FormatSelector.tsx: checkboxes for each format
     * Instagram Reel (9:16) — with specs: 1080x1920, 30fps, max 90s
     * TikTok (9:16) — with specs: 1080x1920, 30fps, max 180s
     * Feed Square (1:1) — 1080x1080
     * Feed Portrait (4:5) — 1080x1350
     * Story (9:16) — 1080x1920, safe areas
   - QualitySettings.tsx:
     * Draft (fast, lower quality) — for previewing
     * Standard (balanced)
     * High (slow, better quality)
     * Maximum (very slow, best quality)
   - Show estimated render time based on video duration + quality

3. Render progress UI:
   - Progress ring animation showing percentage
   - Current frame / total frames counter
   - ETA countdown
   - Cancel button
   - When multi-format: show each format's progress

4. Download/export:
   - After render: show rendered video with play button
   - "Download" button saves to user-chosen location
   - "Open folder" reveals in file explorer
   - File size display

5. Server-side video serving:
   - Serve source videos and renders via Fastify static plugin
   - Source videos: /static/uploads/{projectId}/original.mp4
   - Renders: /static/renders/{renderId}.mp4
   - Support range requests for video seeking

6. Routes:
   - POST /api/projects/:id/render — single format
   - POST /api/projects/:id/render/multi — multiple formats
   - GET /api/renders/:id — status + progress
   - GET /api/renders/:id/download — file download
   - POST /api/renders/:id/cancel

Checklist:
- [ ] Remotion renders video correctly for each format
- [ ] Progress streams in real-time via WebSocket
- [ ] Multi-format render works sequentially
- [ ] Export dialog shows format specs and quality options
- [ ] Cancel stops render in progress
- [ ] Download works for completed renders
- [ ] Rendered video plays correctly in external player
```

### Phase 8: Batch Processing + MCP Server (Week 8)
**Batch queue, parallel processing, MCP integration for IDE use**

```
CLAUDE CODE PROMPT — Phase 8:

Continue building ClipFlow. Phase 8: Batch processing + MCP server.

1. Batch Processing:
   - packages/server/src/services/batch.service.ts:
     * createBatch(videos, template, captionStyle, formats)
     * processBatch(batchId): loop through items sequentially
       - For each video: upload → transcribe → analyze → render
       - Update item status at each stage
       - Stream progress via WebSocket
       - On error: mark item as failed, continue to next
     * pauseBatch(batchId): set flag to stop after current item
     * resumeBatch(batchId): continue from next pending item

   - packages/server/src/workers/batch.worker.ts:
     * Run batch processing in worker thread
     * Prevents blocking the main server

2. Batch UI:
   - BatchQueue.tsx: list of batch jobs with overall progress
   - BatchJobCard.tsx: single job with item breakdown
   - New batch creation flow:
     1. Drop multiple videos
     2. Select template
     3. Select caption style
     4. Select export formats
     5. Optional: per-video override settings
     6. Start batch
   - Real-time progress for each item in the batch
   - Pause/Resume/Cancel controls

3. MCP Server (packages/mcp/):
   - Initialize @modelcontextprotocol/sdk server
   - Tools:
     * clipflow_create_video: full pipeline (video → rendered output)
     * clipflow_transcribe: just transcription
     * clipflow_analyze_video: just analysis
     * clipflow_apply_template: apply template to existing project
     * clipflow_render: trigger render for existing project
     * clipflow_batch_process: process multiple videos
     * clipflow_list_templates: list available templates
   - Each tool calls the ClipFlow HTTP API internally
   - MCP server runs via stdio (compatible with Claude Code / Cursor)

4. MCP OAuth integration:
   - packages/mcp/src/auth/oauth.ts
   - Support OAuth 2.1 with PKCE for Claude API authentication
   - When ANTHROPIC_API_KEY not set, use MCP OAuth flow
   - Dynamic client registration with Anthropic's auth server

5. MCP configuration:
   - Auto-generate ~/.claude/mcp.json entry on setup
   - Also support manual configuration
   - Document Cursor/Windsurf integration

6. CLI entry point:
   - npx @clip/mcp — starts MCP server for IDE integration
   - npx clipflow — starts full web UI
   - npx clipflow batch <dir> --template tech — CLI batch processing

Checklist:
- [ ] Batch processing handles 5+ videos sequentially
- [ ] Progress streams for each batch item
- [ ] Pause/resume works correctly
- [ ] Failed items don't stop the batch
- [ ] MCP server starts and registers tools
- [ ] Claude Code can call clipflow_create_video tool
- [ ] CLI batch mode processes directory of videos
- [ ] Full end-to-end: upload → transcribe → analyze → render via MCP
```

---

## Environment & Prerequisites

```bash
# System requirements
Node.js >= 22 LTS
Python >= 3.10
FFmpeg >= 6.0
pnpm >= 9.0

# Optional (for GPU acceleration)
CUDA >= 12.0 (NVIDIA GPU transcription)
# or
Apple Silicon (MPS acceleration automatic)

# Environment variables (.env)
ANTHROPIC_API_KEY=sk-ant-...           # Claude API (or use MCP OAuth)
HF_TOKEN=hf_...                        # HuggingFace (for speaker diarization)
CLIPFLOW_PORT=4400                     # Server port
CLIPFLOW_DATA_DIR=./data               # Data storage path
REMOTION_LICENSE_KEY=...               # Optional: Remotion license for Lambda
```

### Setup Script

```bash
#!/bin/bash
# scripts/setup.sh

echo "🎬 ClipFlow Setup"
echo "=================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Node.js 22+ required. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Install from https://python.org"
    exit 1
fi
echo "✅ Python $(python3 --version)"

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ffmpeg
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y ffmpeg
    fi
fi
echo "✅ FFmpeg $(ffmpeg -version | head -1)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm --version)"

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
pnpm install

# Setup Python environment for WhisperX
echo "🐍 Setting up WhisperX..."
cd whisper
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install whisperx torch torchaudio
deactivate
cd ..

# Create data directories
mkdir -p data/{db,uploads,audio,transcriptions,renders,templates}

# Copy .env.example if no .env exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Created .env file. Please add your API keys."
fi

# Run initial DB migration
echo "🗄️  Running database migrations..."
pnpm --filter @clip/server run db:push

# Seed default templates
echo "🎨 Seeding default templates..."
pnpm --filter @clip/server run db:seed

echo ""
echo "✅ ClipFlow setup complete!"
echo ""
echo "To start:"
echo "  pnpm dev        # Start web UI"
echo "  pnpm mcp        # Start MCP server for Claude Code"
echo ""
```

---

## Cost Estimation (per video)

| Service | Cost | Notes |
|---------|------|-------|
| WhisperX (local) | $0.00 | Runs on user's hardware |
| Claude Sonnet 4.6 (analysis) | ~$0.02 | ~2K input + 1K output tokens |
| Claude Sonnet 4.6 (captions) | ~$0.01 | Caption optimization |
| Remotion render (local) | $0.00 | Local rendering, no Lambda |
| FFmpeg (local) | $0.00 | Local processing |
| **Total per video** | **~$0.03** | Almost entirely local |

For batch of 10 videos: ~$0.30
For batch of 100 videos: ~$3.00

With Remotion Lambda (optional): add ~$0.005-$0.02 per render for faster processing.

---

## Future Roadmap (Post-v1)

1. **Music Library Integration** — royalty-free music matching via mood/BPM
2. **B-Roll Library** — auto-suggest stock footage from Pexels/Pixabay APIs
3. **A/B Testing** — generate 2-3 variations and let user pick
4. **Analytics Dashboard** — track post performance after publishing
5. **Team Collaboration** — share projects via local network
6. **Plugin System** — custom effects, transitions, caption styles as npm packages
7. **Remotion Lambda** — cloud rendering for faster batch processing
8. **Mobile Preview** — QR code to preview on phone before publishing
9. **Voice Cloning** — AI voiceover in different languages (dubbing)
10. **Auto-Publish** — integrate with Instagram/TikTok APIs for direct posting

---

## Summary

ClipFlow is a **local-first, AI-native video editing framework** that:

- Runs entirely on the user's machine (privacy-first, low cost)
- Uses the **WhisperX → Claude → Remotion** pipeline for intelligent editing
- Offers a rich browser-based UI with timeline editing and live preview
- Supports **6 niche templates** with full customization
- Exports to **5 platform-optimized formats** simultaneously
- Processes **batches of videos** with consistent branding
- Integrates as an **MCP tool** for Claude Code / Cursor / Windsurf
- Costs approximately **$0.03 per video** (only Claude API calls)

The project is designed as a TypeScript monorepo with clear separation of concerns, making it maintainable and extensible. Each phase builds on the previous one, allowing incremental development with working software at every stage.
