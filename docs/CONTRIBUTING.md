# Contributing to ClipFlow

Thank you for your interest in contributing to ClipFlow. This guide covers the development setup, project conventions, and how to add new features.

---

## Table of Contents

1. [Development Setup](#1-development-setup)
2. [Project Structure](#2-project-structure)
3. [Code Style](#3-code-style)
4. [Adding a New Route](#4-adding-a-new-route)
5. [Adding a New Component](#5-adding-a-new-component)
6. [Adding Translations](#6-adding-translations)
7. [Database Changes](#7-database-changes)
8. [Commit Convention](#8-commit-convention)
9. [Testing](#9-testing)

---

## 1. Development Setup

```bash
# Clone the repository
git clone https://github.com/willianfellipe-coder/clipflow-framework.git
cd clipflow-framework

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Set up WhisperX (optional, needed for transcription)
bash scripts/setup.sh

# Start development servers
pnpm dev
```

This starts all packages in parallel via Turborepo:
- **Server** at `http://localhost:4400` (Fastify API with hot reload)
- **App** at `http://localhost:4401` (Vite dev server with HMR)
- **API docs** at `http://localhost:4400/docs` (Swagger UI)

The browser opens automatically when the dev server is ready.

---

## 2. Project Structure

ClipFlow is a pnpm monorepo managed by Turborepo. There are 5 packages:

```
packages/
  shared/     @clip/shared    Types, Zod schemas, constants (formats, presets, niches)
  server/     @clip/server    Fastify API server, SQLite database, services
  app/        @clip/app       React frontend (Vite + Tailwind CSS + Zustand)
  remotion/   @clip/remotion  Video compositions and caption animations
  mcp/        @clip/mcp       MCP server for IDE integration (7 tools)
```

### Package dependency graph

```
shared  <--  server
  ^           ^
  |           |
  +---  app   |
  |           |
  +-- remotion|
  |           |
  +---  mcp --+
```

`@clip/shared` is imported by all other packages. It contains no runtime dependencies -- only TypeScript types, Zod validation schemas, and constant definitions.

### Key directories

```
packages/server/src/
  config.ts          Server configuration and paths
  index.ts           Entry point -- registers plugins and routes
  db/
    schema.ts        Drizzle ORM table definitions
    index.ts         Database initialization
    seed.ts          Seed data (built-in templates, presets)
  plugins/
    cors.ts          CORS configuration
    websocket.ts     WebSocket plugin
    swagger.ts       Swagger/OpenAPI docs
    static.ts        Static file serving
  routes/
    projects.ts      CRUD for projects
    upload.ts        Video upload handling
    transcription.ts Transcription endpoints
    analysis.ts      AI analysis endpoints
    scenes.ts        Scene management
    captions.ts      Caption style endpoints
    templates.ts     Template CRUD
    render.ts        Export/render endpoints
    batch.ts         Batch processing endpoints
    clips.ts         ClipGen endpoints
    settings.ts      Settings + health check + system check
  services/
    ffmpeg.service.ts    FFmpeg operations (metadata, audio extraction, thumbnails)
    whisper.service.ts   WhisperX Python sidecar integration
    claude.service.ts    Anthropic API calls
    remotion.service.ts  Remotion rendering
    batch.service.ts     Batch job orchestration
    clipgen.service.ts   ClipGen AI analysis

packages/app/src/
  App.tsx            Router configuration
  main.tsx           Entry point
  components/
    layout/          MainLayout, Sidebar, Header
    upload/          DropZone, UploadProgress, VideoMetadataCard
    editor/          ScenePanel, SceneCard, AnalysisProgress
    preview/         VideoPreview (Remotion player)
    timeline/        TimelineEditor, TimelineRuler, SceneClip, CaptionTrack
    captions/        CaptionEditor, CaptionStylePicker, WordTimingAdjust
    template/        NicheSelector, TemplateCard, TemplatePreview, TemplateCreateForm
    export/          ExportDialog, FormatSelector, QualitySettings, RenderProgress
    batch/           BatchJobCard
    clipgen/         ClipGenConfig, ClipCard
    common/          StatusBadge, ProgressRing
  pages/
    Dashboard.tsx    Upload + recent projects
    Editor.tsx       Main editing interface
    ClipGen.tsx      Viral clip extraction
    Templates.tsx    Template gallery
    BatchJobs.tsx    Batch processing
    Settings.tsx     App configuration
    History.tsx      Past renders
  stores/
    projectStore.ts  Zustand store for project state
    settingsStore.ts Zustand store for app settings
  locales/
    en.json          English translations
    pt-BR.json       Portuguese translations
  lib/
    api.ts           HTTP client for server API
    ws.ts            WebSocket client
    utils.ts         Utility functions (cn, etc.)
  hooks/
    useWebSocket.ts  WebSocket React hook
```

---

## 3. Code Style

### TypeScript

- **Strict mode** is enabled across all packages (`tsconfig.base.json`).
- Use explicit types for function parameters and return values in service code.
- Prefer `interface` over `type` for object shapes.
- Use Zod schemas (in `@clip/shared`) for runtime validation of API inputs.

### Frontend (React)

- **Tailwind CSS 4** for all styling. No CSS modules or styled-components.
- Use the `cn()` utility (from `lib/utils.ts`, based on `clsx` + `tailwind-merge`) to conditionally combine class names:
  ```tsx
  <div className={cn('p-4 rounded-lg', isActive && 'bg-blue-500')}>
  ```
- **Zustand 5** for state management. Stores are in `stores/` and use the immer middleware for immutable updates.
- React Router for navigation. Routes are defined in `App.tsx`.
- Use `lucide-react` for icons.

### Backend (Fastify)

- Routes are registered as **Fastify plugins** (async functions that receive a `FastifyInstance`).
- All routes are prefixed with `/api/`.
- Use Drizzle ORM for database queries (no raw SQL).
- Use pino (via Fastify's built-in logger) for logging.
- WebSocket messages follow the types defined in `@clip/shared`.

### General conventions

- File names use **camelCase** for TypeScript files and **PascalCase** for React components.
- Add `cursor-pointer` to all clickable elements in Tailwind classes.
- Add `aria-label` attributes to interactive elements for accessibility.
- Keep components focused -- if a component exceeds ~200 lines, consider splitting it.

---

## 4. Adding a New Route

### Step 1: Define types in shared

If the route handles new data shapes, add types to the appropriate file in `packages/shared/src/types/`:

```typescript
// packages/shared/src/types/myFeature.ts
export interface MyFeature {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CreateMyFeatureInput {
  name: string;
}
```

Export the new types from the shared package index.

### Step 2: Create the route file

Create a new file in `packages/server/src/routes/`:

```typescript
// packages/server/src/routes/myFeature.ts
import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';

export async function myFeatureRoutes(app: FastifyInstance) {
  // GET /api/my-feature
  app.get('/api/my-feature', async (request, reply) => {
    // Implementation
  });

  // POST /api/my-feature
  app.post<{ Body: CreateMyFeatureInput }>('/api/my-feature', async (request, reply) => {
    // Implementation
  });
}
```

### Step 3: Register the route

Add the import and registration in `packages/server/src/index.ts`:

```typescript
import { myFeatureRoutes } from './routes/myFeature.js';

// Inside the start() function, with the other route registrations:
await app.register(myFeatureRoutes);
```

---

## 5. Adding a New Component

### Step 1: Choose the right directory

Place the component in the appropriate subdirectory of `packages/app/src/components/`:

| Directory | For |
|-----------|-----|
| `layout/` | Shell components (sidebar, header, layout wrappers) |
| `upload/` | Upload-related UI |
| `editor/` | Scene management, analysis UI |
| `preview/` | Video preview / Remotion player |
| `timeline/` | Timeline tracks, ruler, clips |
| `captions/` | Caption editing and styling |
| `template/` | Template gallery, creation, preview |
| `export/` | Export dialog, format selection, render progress |
| `batch/` | Batch job UI |
| `clipgen/` | ClipGen configuration and clip cards |
| `common/` | Reusable UI elements (badges, progress indicators) |

### Step 2: Write the component

```tsx
// packages/app/src/components/mydir/MyComponent.tsx
import { cn } from '../../lib/utils';

interface MyComponentProps {
  title: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function MyComponent({ title, isActive, onClick }: MyComponentProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'
      )}
      onClick={onClick}
      aria-label={title}
    >
      {title}
    </button>
  );
}
```

Key points:
- Use `cn()` for conditional class merging.
- Add `cursor-pointer` to clickable elements.
- Add `aria-label` for accessibility.
- Export the component as a named export (not default).
- Define props with an `interface`.

---

## 6. Adding Translations

ClipFlow supports English and Portuguese (pt-BR). When adding new user-facing text, you must add keys to both locale files.

### Locale files

- `packages/app/src/locales/en.json` -- English
- `packages/app/src/locales/pt-BR.json` -- Portuguese (Brazil)

### Steps

1. Add the key to the appropriate section in `en.json`:
   ```json
   {
     "myFeature": {
       "title": "My Feature",
       "description": "This does something useful"
     }
   }
   ```

2. Add the same key with a Portuguese translation in `pt-BR.json`:
   ```json
   {
     "myFeature": {
       "title": "Meu Recurso",
       "description": "Isso faz algo util"
     }
   }
   ```

3. Use the translation key in your component via the i18n system.

### Rules

- **Always add keys to both files.** Missing keys in one file will cause the raw key string to display.
- Use interpolation for dynamic values: `"Used {{count}} times"`.
- Group keys by feature or page (e.g., `dashboard.*`, `editor.*`, `templates.*`).

---

## 7. Database Changes

ClipFlow uses SQLite via Drizzle ORM. The schema is defined in code, not migration files.

### Step 1: Update the schema

Edit `packages/server/src/db/schema.ts` to add or modify tables:

```typescript
export const myFeatures = sqliteTable('my_features', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  projectId: text('project_id').references(() => projects.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

### Step 2: Update database initialization

Edit `packages/server/src/db/index.ts` and add the `CREATE TABLE IF NOT EXISTS` statement in the `initializeDatabase()` function. This ensures the table is created on server startup if it does not already exist.

```typescript
export function initializeDatabase() {
  // ... existing tables ...

  db.run(sql`
    CREATE TABLE IF NOT EXISTS my_features (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      project_id TEXT REFERENCES projects(id),
      created_at INTEGER NOT NULL
    )
  `);
}
```

### Step 3: Seed data (optional)

If your feature needs default/built-in data, add seed logic in `packages/server/src/db/seed.ts`.

### Important notes

- Column names in the schema use **camelCase** in TypeScript but **snake_case** in the database (Drizzle handles the mapping via the string argument in column definitions).
- Use `text('id').primaryKey()` with nanoid for IDs.
- Use `integer('...', { mode: 'timestamp' })` for date columns.
- Use `text('...').references(() => otherTable.id)` for foreign keys.
- Store JSON data as `text` columns and parse/stringify in the service layer.

---

## 8. Commit Convention

Use conventional commit prefixes for all commit messages:

| Prefix | Use for |
|--------|---------|
| `feat:` | New features or capabilities |
| `fix:` | Bug fixes |
| `style:` | UI/CSS changes, code formatting (no logic changes) |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring without changing behavior |
| `perf:` | Performance improvements |
| `chore:` | Build config, dependencies, tooling changes |

### Examples

```
feat: add speaker diarization toggle to settings page
fix: prevent crash when transcription returns empty segments
style: align export dialog buttons on mobile viewports
docs: add deployment guide for production servers
refactor: extract ffmpeg operations into dedicated service
chore: upgrade Remotion to 4.x
```

### Guidelines

- Keep the subject line under 72 characters.
- Use imperative mood ("add", "fix", "update", not "added", "fixed", "updated").
- Reference issue numbers when applicable: `fix: handle empty transcription (#42)`.

---

## 9. Testing

ClipFlow currently uses manual testing. Here is the recommended workflow:

### Start the development environment

```bash
pnpm dev
```

This starts both the server and frontend with hot reload.

### Test API endpoints with curl

```bash
# Health check
curl http://localhost:4400/api/health

# System check
curl http://localhost:4400/api/settings/system-check

# List projects
curl http://localhost:4400/api/projects

# List templates
curl http://localhost:4400/api/templates

# Get settings
curl http://localhost:4400/api/settings
```

### Test a full workflow

1. **Upload** -- Drag a video onto the Dashboard upload zone.
2. **Transcribe** -- Open the project in the Editor and click Transcribe.
3. **Analyze** -- After transcription completes, click "Analyze with AI".
4. **Edit** -- Verify scenes appear in the Scene Panel and Timeline.
5. **Captions** -- Switch caption styles and confirm the preview updates.
6. **Template** -- Go to Templates, apply one, return to the Editor and verify settings applied.
7. **Export** -- Open the Export dialog, select a format, render, and download.
8. **ClipGen** -- Navigate to ClipGen, configure and run analysis, verify clip suggestions.
9. **Batch** -- Create a batch job with multiple videos, start it, verify progress.

### Swagger UI

For interactive API exploration, open `http://localhost:4400/docs` in your browser. All endpoints are documented with request/response schemas.

### Tips

- Check the browser console for frontend errors.
- Check the server terminal for backend errors (pino logs).
- WebSocket connection status is shown in the sidebar (Connected/Disconnected).
- If transcription fails, verify WhisperX is set up correctly with `curl http://localhost:4400/api/settings/system-check`.
