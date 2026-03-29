# ClipFlow API Reference

Base URL: `http://localhost:4400`

All endpoints return JSON. Asynchronous operations (transcription, analysis, render) return `202 Accepted` and broadcast progress via WebSocket.

---

## Projects (6 endpoints)

### GET /api/projects

List all projects.

**Response**
```json
[
  {
    "id": "abc123",
    "name": "My Video",
    "description": null,
    "status": "draft",
    "sourceVideoPath": "/data/uploads/abc123/original.mp4",
    "sourceVideoMeta": "{...}",
    "thumbnailPath": "/data/uploads/abc123/thumbnail.jpg",
    "templateId": null,
    "nicheId": null,
    "settings": null,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
]
```

### GET /api/projects/:id

Get project details.

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | string | Project ID  |

**Response:** Single project object (same shape as list item).

### POST /api/projects

Create a new project (without upload).

**Request Body**
```json
{
  "name": "My Video",
  "description": "Optional description",
  "sourceVideoPath": "/path/to/video.mp4"
}
```

**Response:** `200` — Created project object.

### PATCH /api/projects/:id

Update project. Only whitelisted fields are accepted (SEC-005).

**Allowed fields:** `name`, `description`, `nicheId`, `settings`

**Request Body**
```json
{
  "name": "Updated Name",
  "nicheId": "fitness",
  "settings": "{\"captionAnimation\":\"karaoke\"}"
}
```

**Response:** Updated project object.

### POST /api/projects/:id/apply-template

Apply a template to a project. Copies template config into project settings, applies default effects/transitions to existing scenes, and increments the template usage counter.

**Request Body**
```json
{
  "templateId": "tmpl_xyz"
}
```

**Response:** Updated project object.

### DELETE /api/projects/:id

Delete a project.

**Response:** `204 No Content`

---

## Upload (1 endpoint)

### POST /api/upload

Upload a video file. Creates a project automatically.

- **Content-Type:** `multipart/form-data`
- **Max file size:** 500 MB
- **Accepted formats:** MP4, MOV, WebM, AVI, MKV

The server probes the video with FFmpeg to extract metadata and generates a thumbnail at 25% of the video duration.

**Response:** `201`
```json
{
  "id": "abc123",
  "name": "my-video",
  "status": "draft",
  "sourceVideoPath": "/data/uploads/abc123/original.mp4",
  "sourceVideoMeta": "{\"duration\":120,\"width\":1920,\"height\":1080,\"fps\":30}",
  "thumbnailPath": "/data/uploads/abc123/thumbnail.jpg",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

**Error codes:** `NO_FILE`, `INVALID_MIME`, `FILE_TOO_LARGE`, `PROBE_FAILED`

---

## Transcription (2 endpoints)

### POST /api/projects/:id/transcribe

Start WhisperX transcription. Runs in background; progress broadcast via WebSocket.

**Request Body** (optional)
```json
{
  "model": "large-v3",
  "language": "en"
}
```

**Response:** `202`
```json
{
  "message": "Transcription started",
  "projectId": "abc123"
}
```

**WebSocket events:** `transcription:progress`, `transcription:complete`, `transcription:error`

### GET /api/projects/:id/transcription

Get the most recent transcription result.

**Response**
```json
{
  "id": "tx_001",
  "projectId": "abc123",
  "model": "large-v3",
  "language": "en",
  "fullText": "Hello everyone, welcome to...",
  "wordTimestamps": [
    { "word": "Hello", "start": 0.0, "end": 0.45 },
    { "word": "everyone", "start": 0.48, "end": 0.92 }
  ],
  "segments": [
    { "text": "Hello everyone, welcome to...", "start": 0.0, "end": 4.2 }
  ],
  "speakers": null,
  "duration": 120.5,
  "processingTime": 15.3,
  "createdAt": "2025-01-15T10:01:00.000Z"
}
```

---

## Analysis (2 endpoints)

### POST /api/projects/:id/analyze

Start Claude AI analysis. Requires a completed transcription. Uses atomic status update (DAT-001) to prevent race conditions.

**Request Body** (optional)
```json
{
  "niche": "fitness",
  "templateId": "tmpl_xyz",
  "instructions": "Focus on the hook and keep it under 60 seconds"
}
```

**Response:** `202`
```json
{
  "message": "Analysis started",
  "projectId": "abc123"
}
```

**WebSocket events:** `analysis:progress`, `analysis:complete`, `analysis:error`

### GET /api/projects/:id/analysis

Get the most recent analysis result.

**Response**
```json
{
  "id": "an_001",
  "projectId": "abc123",
  "model": "claude-sonnet-4-6",
  "scenePlan": [
    { "order": 1, "startTime": 0, "endTime": 3.5, "type": "hook", "description": "Strong opening" }
  ],
  "suggestedCuts": [{ "time": 15.2, "reason": "Dead air" }],
  "suggestedEffects": [{ "scene": 1, "effect": "zoom-in" }],
  "hookAnalysis": { "score": 85, "suggestion": "Great opening hook" },
  "ctaAnalysis": { "hasCallToAction": true, "suggestion": "Add subscribe reminder" },
  "contentScore": 82,
  "tokensUsed": 1450,
  "createdAt": "2025-01-15T10:02:00.000Z"
}
```

---

## Scenes (5 endpoints)

### GET /api/projects/:id/scenes

List scenes for a project, ordered by `order`.

**Response**
```json
[
  {
    "id": "sc_001",
    "projectId": "abc123",
    "analysisId": "an_001",
    "order": 1,
    "startTime": 0.0,
    "endTime": 3.5,
    "type": "hook",
    "description": "Opening hook",
    "captionText": null,
    "effects": ["zoom-in"],
    "zoomConfig": null,
    "transitionIn": "cut",
    "transitionOut": "cut",
    "isActive": true,
    "createdAt": "2025-01-15T10:02:00.000Z"
  }
]
```

### PUT /api/projects/:id/scenes

Replace all scenes for a project (deletes existing, inserts new).

**Request Body**
```json
{
  "scenes": [
    {
      "order": 1,
      "startTime": 0,
      "endTime": 3.5,
      "type": "hook",
      "description": "Opening",
      "effects": ["zoom-in"],
      "transitionIn": "cut",
      "transitionOut": "fade"
    }
  ]
}
```

**Scene types:** `hook`, `content`, `transition`, `broll`, `cta`, `outro`

**Response:** Array of created scenes.

### PATCH /api/projects/:id/scenes/:sid

Update a single scene.

**Request Body** (any subset)
```json
{
  "startTime": 0.5,
  "endTime": 4.0,
  "type": "content",
  "description": "Updated description",
  "effects": ["zoom-in", "flash"],
  "zoomConfig": { "scale": 1.3, "x": 0.5, "y": 0.3 },
  "transitionIn": "slide",
  "transitionOut": "fade",
  "isActive": false,
  "captionText": "Custom caption"
}
```

**Response:** Updated scene object.

### POST /api/projects/:id/scenes/reorder

Reorder scenes by providing an ordered array of scene IDs.

**Request Body**
```json
{
  "sceneIds": ["sc_003", "sc_001", "sc_002"]
}
```

**Response:** Array of reordered scenes.

### POST /api/projects/:id/scenes/auto-cut

Auto-cut (redirects to analysis). Returns `501` with a message directing to `POST /api/projects/:id/analyze`.

---

## Captions (5 endpoints)

### GET /api/projects/:id/captions

Get word-level caption timestamps from the transcription.

**Response**
```json
{
  "projectId": "abc123",
  "wordTimestamps": [
    { "word": "Hello", "start": 0.0, "end": 0.45 },
    { "word": "everyone", "start": 0.48, "end": 0.92 }
  ],
  "segments": [
    { "text": "Hello everyone", "start": 0.0, "end": 0.92 }
  ],
  "language": "en"
}
```

### PATCH /api/projects/:id/captions

Update caption word timestamps (for manual corrections).

**Request Body**
```json
{
  "wordTimestamps": [
    { "word": "Hello", "start": 0.0, "end": 0.5, "confidence": 0.98 }
  ]
}
```

**Response:** `{ "ok": true }`

### GET /api/caption-styles

List all caption style presets and custom styles.

**Response**
```json
[
  {
    "id": "cs_001",
    "name": "Word Highlight",
    "isPreset": true,
    "fontFamily": "Inter",
    "fontSize": 48,
    "fontWeight": "800",
    "color": "#FFFFFF",
    "highlightColor": "#FFD700",
    "strokeColor": "#000000",
    "strokeWidth": 4,
    "backgroundColor": null,
    "backgroundPadding": null,
    "backgroundRadius": null,
    "position": "bottom",
    "animation": "word-highlight",
    "maxWordsPerLine": 4,
    "shadowConfig": null,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
]
```

**Animation values:** `none`, `word-highlight`, `karaoke`, `pop`, `glow`, `typewriter`, `bounce`

### POST /api/caption-styles

Create a custom caption style.

**Request Body**
```json
{
  "name": "My Style",
  "projectId": "abc123",
  "fontFamily": "Plus Jakarta Sans",
  "fontSize": 52,
  "fontWeight": "900",
  "color": "#FFFFFF",
  "highlightColor": "#FF4444",
  "strokeColor": "#000000",
  "strokeWidth": 3,
  "position": "center",
  "animation": "karaoke",
  "maxWordsPerLine": 3
}
```

**Response:** `201` — Created caption style object.

### PATCH /api/caption-styles/:id

Update a caption style.

**Allowed fields:** `name`, `fontFamily`, `fontSize`, `fontWeight`, `color`, `highlightColor`, `strokeColor`, `strokeWidth`, `position`, `animation`, `maxWordsPerLine`, `backgroundColor`, `backgroundPadding`, `backgroundRadius`, `shadowConfig`

**Response:** Updated caption style object.

---

## Templates (6 endpoints)

### GET /api/templates

List all templates (built-in and custom).

**Response**
```json
[
  {
    "id": "tmpl_001",
    "name": "Fitness Reels",
    "description": "High-energy fitness content",
    "niche": "fitness",
    "isBuiltIn": true,
    "isPublished": true,
    "composition": "ReelComposition",
    "defaultCaptionStyleId": "cs_001",
    "defaultEffects": "[\"zoom-in\",\"flash\"]",
    "defaultTransitions": "[\"cut\",\"slide\"]",
    "colorPalette": "[\"#FF4444\",\"#FFFFFF\"]",
    "hookConfig": "{\"enabled\":true}",
    "ctaConfig": "{\"enabled\":true,\"text\":\"Follow!\"}",
    "layoutConfig": null,
    "musicConfig": null,
    "usageCount": 5,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
]
```

### GET /api/templates/:id

Get a single template by ID.

**Response:** Single template object.

### POST /api/templates

Create a custom template.

**Request Body**
```json
{
  "name": "My Template",
  "niche": "cooking",
  "description": "Cooking content template",
  "composition": "ReelComposition",
  "defaultEffects": ["zoom-in"],
  "defaultTransitions": ["cut", "fade"],
  "colorPalette": ["#FF6B35", "#FFFFFF"],
  "hookConfig": { "enabled": true, "style": "text-overlay" },
  "ctaConfig": { "enabled": true, "text": "Follow for recipes!" }
}
```

**Response:** `201` — Created template object.

### PATCH /api/templates/:id

Update a template.

**Allowed fields:** `name`, `description`, `niche`, `composition`, `defaultEffects`, `defaultTransitions`, `colorPalette`, `hookConfig`, `ctaConfig`, `isPublished`

**Response:** Updated template object.

### DELETE /api/templates/:id

Delete a custom template. Built-in templates cannot be deleted (returns `403`).

**Response:** `204 No Content`

### GET /api/templates/:id/preview

Get a template with all JSON config fields parsed into objects.

**Response:** Same as template object but with `defaultEffects`, `defaultTransitions`, `colorPalette`, `hookConfig`, `ctaConfig`, `musicConfig`, and `layoutConfig` parsed from JSON strings into arrays/objects.

---

## Render (6 endpoints)

### POST /api/projects/:id/render

Start a single-format render. Runs in background.

**Request Body**
```json
{
  "format": "reel_9x16",
  "quality": "standard"
}
```

| Field     | Type   | Values                                                     | Default      |
|-----------|--------|------------------------------------------------------------|--------------|
| `format`  | string | `reel_9x16`, `tiktok_9x16`, `feed_1x1`, `feed_4x5`, `story_9x16` | `reel_9x16`  |
| `quality` | string | `draft`, `standard`, `high`, `maximum`                     | `standard`   |

**Response:** `202`
```json
{
  "message": "Render started",
  "renderId": "rnd_001"
}
```

### POST /api/projects/:id/render/multi

Start a multi-format render. Formats are rendered sequentially in background.

**Request Body**
```json
{
  "formats": ["reel_9x16", "feed_1x1", "tiktok_9x16"],
  "quality": "high"
}
```

**Response:** `202`
```json
{
  "message": "Multi-render started",
  "renderIds": ["rnd_001", "rnd_002", "rnd_003"]
}
```

### GET /api/renders/:id

Get render status.

**Response**
```json
{
  "id": "rnd_001",
  "projectId": "abc123",
  "format": "reel_9x16",
  "status": "rendering",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "codec": "h264",
  "quality": "standard",
  "progress": 45.5,
  "outputPath": null,
  "fileSize": null,
  "renderTime": null,
  "errorMessage": null,
  "createdAt": "2025-01-15T10:05:00.000Z",
  "completedAt": null
}
```

**Render statuses:** `queued`, `rendering`, `encoding`, `done`, `error`

### GET /api/renders/:id/download

Download the rendered video file. Includes path traversal protection (SEC-002).

**Response:** Binary video stream with headers:
- `Content-Type: video/mp4`
- `Content-Disposition: attachment; filename="clipflow_reel_9x16_rnd_001.mp4"`

**Error codes:** `NOT_READY` (render not complete), `PATH_TRAVERSAL` (security), `FILE_NOT_FOUND`

### POST /api/renders/:id/cancel

Cancel an in-progress render.

**Response**
```json
{
  "message": "Render cancelled"
}
```

### GET /api/projects/:id/renders

List all renders for a project.

**Response:** Array of render objects.

---

## Batch (6 endpoints)

### POST /api/batch

Create a batch job. Validates all video paths exist and checks for path traversal (SEC-008).

**Request Body**
```json
{
  "name": "Weekend Batch",
  "videoPaths": ["/path/to/video1.mp4", "/path/to/video2.mp4"],
  "templateId": "tmpl_001",
  "captionStyleId": "cs_001",
  "formats": ["reel_9x16", "tiktok_9x16"],
  "settings": {}
}
```

**Response:** `201`
```json
{
  "id": "batch_001",
  "name": "Weekend Batch",
  "status": "pending",
  "templateId": "tmpl_001",
  "captionStyleId": "cs_001",
  "formats": "[\"reel_9x16\",\"tiktok_9x16\"]",
  "totalVideos": 2,
  "completedVideos": 0,
  "failedVideos": 0,
  "items": [
    { "id": "bi_001", "sourceVideoPath": "/path/to/video1.mp4", "status": "pending", "order": 1 }
  ]
}
```

### GET /api/batch

List all batch jobs.

**Response:** Array of batch job objects (without items).

### GET /api/batch/:id

Get batch job details with all items.

**Response:** Batch job object with `items` array.

### POST /api/batch/:id/start

Start or resume batch processing. Returns `409` if already processing.

**Response:** `202`
```json
{
  "message": "Batch processing started",
  "batchId": "batch_001"
}
```

**WebSocket events:** `batch:item:progress`, `batch:item:complete`, `batch:complete`

### POST /api/batch/:id/pause

Pause batch processing.

**Response**
```json
{
  "message": "Batch paused"
}
```

### DELETE /api/batch/:id

Delete a batch job and all its items. Pauses processing first.

**Response:** `204 No Content`

---

## ClipGen (10 endpoints)

### POST /api/clips/analyze/:projectId

Start AI clip analysis. Requires a completed transcription. Analyzes the video for viral-worthy moments and creates clip suggestions.

**Request Body**
```json
{
  "targetDuration": 30,
  "numberOfClips": 5,
  "targetPlatform": "tiktok",
  "niche": "fitness",
  "tone": "energetic",
  "customInstructions": "Focus on transformation moments"
}
```

**Response:** `202`
```json
{
  "message": "Clip analysis started",
  "analysisId": "ca_001"
}
```

**WebSocket events:** `clipgen:progress`, `clipgen:complete`, `clipgen:error`

### GET /api/clips/analyses/:projectId

List all clip analyses for a project, newest first.

**Response**
```json
[
  {
    "id": "ca_001",
    "projectId": "abc123",
    "transcriptionId": "tx_001",
    "targetDuration": 30,
    "numberOfClips": 5,
    "targetPlatform": "tiktok",
    "niche": "fitness",
    "tone": "energetic",
    "status": "done",
    "clipsGenerated": 5,
    "modelUsed": "claude-sonnet-4-6",
    "tokensUsed": 2100,
    "createdAt": "2025-01-15T10:03:00.000Z",
    "completedAt": "2025-01-15T10:03:30.000Z"
  }
]
```

### GET /api/clips/:projectId

List all clips for a project, sorted by hook score (highest first).

**Response**
```json
[
  {
    "id": "clip_001",
    "projectId": "abc123",
    "analysisId": "ca_001",
    "startTime": 12.5,
    "endTime": 42.8,
    "title": "The 30-Second Ab Workout",
    "hookSentence": "You only need 30 seconds for this",
    "hookScore": 92,
    "emotionalTone": "energetic",
    "suggestedHashtags": ["#fitness", "#abs", "#workout"],
    "aiReason": "Strong hook with clear value proposition",
    "status": "suggested",
    "orderIndex": 0,
    "aspectRatio": "9:16",
    "targetPlatform": "tiktok",
    "quality": "standard",
    "zoomConfig": null,
    "ctaConfig": null,
    "showProgressBar": true
  }
]
```

### PATCH /api/clips/:clipId

Update a single clip.

**Allowed fields:** `title`, `hookSentence`, `startTime`, `endTime`, `captionAnimation`, `aspectRatio`, `quality`, `targetPlatform`, `orderIndex`, `showProgressBar`, `suggestedHashtags`, `zoomConfig`, `ctaConfig`

**Response:** Updated clip object.

### PATCH /api/clips/:clipId/status

Update clip status.

**Request Body**
```json
{
  "status": "selected"
}
```

**Clip statuses:** `suggested`, `selected`, `editing`, `queued`, `rendering`, `done`, `error`, `rejected`

**Response:** Updated clip object.

### PUT /api/clips/:projectId/bulk

Bulk update multiple clips.

**Request Body**
```json
{
  "clipIds": ["clip_001", "clip_002"],
  "updates": {
    "status": "selected",
    "quality": "high",
    "targetPlatform": "instagram"
  }
}
```

**Response**
```json
{
  "updated": 2
}
```

### DELETE /api/clips/:clipId

Soft-delete a clip by setting its status to `rejected`.

**Response**
```json
{
  "message": "Clip rejected"
}
```

### GET /api/clips/presets

List all clip presets, sorted by name.

**Response**
```json
[
  {
    "id": "cp_001",
    "name": "TikTok Quick",
    "description": "Short, punchy TikTok clips",
    "targetDuration": 15,
    "numberOfClips": 10,
    "targetPlatform": "tiktok",
    "niche": null,
    "tone": "energetic",
    "customInstructions": null,
    "captionAnimation": "word-highlight",
    "isBuiltIn": false,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
]
```

### POST /api/clips/presets

Create a clip preset.

**Request Body**
```json
{
  "name": "YouTube Shorts",
  "description": "60-second highlights for YouTube",
  "targetDuration": 60,
  "numberOfClips": 3,
  "targetPlatform": "youtube",
  "tone": "informative",
  "captionAnimation": "pop"
}
```

**Response:** `201` — Created preset object.

### DELETE /api/clips/presets/:presetId

Delete a clip preset.

**Response:** `204 No Content`

---

## Settings (4 endpoints)

### GET /api/settings

Get all settings as a key-value map.

**Response**
```json
{
  "initialized": "true",
  "language": "en",
  "theme": "dark"
}
```

### PATCH /api/settings

Update one or more settings. Creates keys that do not exist yet.

**Request Body**
```json
{
  "language": "pt-BR",
  "theme": "light"
}
```

**Response:** `{ "ok": true }`

### GET /api/settings/system-check

System health check. Verifies external dependencies.

**Response**
```json
{
  "node": "v22.0.0",
  "platform": "darwin",
  "ffmpeg": true,
  "whisperx": true,
  "chromium": true,
  "database": true
}
```

### GET /api/health

Lightweight health check for load balancers and monitoring.

**Response**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:00:00.000Z",
  "uptime": 3600.5
}
```

---

## WebSocket

### ws://localhost:4400/ws

Real-time event stream. Connect with any WebSocket client.

**Message format**
```json
{
  "event": "event_name",
  "data": { ... }
}
```

### Events

| Event | Data | Trigger |
|-------|------|---------|
| `connected` | `{ version: "0.1.0" }` | On WebSocket connect |
| `transcription:progress` | `{ projectId, percent, currentSegment }` | During transcription |
| `transcription:complete` | `{ projectId, transcriptionId }` | Transcription done |
| `transcription:error` | `{ projectId, error }` | Transcription failed |
| `analysis:progress` | `{ projectId, stage }` | During AI analysis |
| `analysis:complete` | `{ projectId, analysisId }` | Analysis done |
| `analysis:error` | `{ projectId, error }` | Analysis failed |
| `render:progress` | `{ renderId, percent, currentFrame, totalFrames, eta }` | During render |
| `render:complete` | `{ renderId, outputPath, fileSize }` | Render done |
| `render:error` | `{ renderId, error }` | Render failed |
| `batch:item:progress` | `{ batchId, itemId, stage }` | During batch item |
| `batch:item:complete` | `{ batchId, itemId }` | Batch item done |
| `batch:complete` | `{ batchId }` | All batch items done |
| `clipgen:progress` | `{ analysisId, stage }` | During clip analysis |
| `clipgen:complete` | `{ analysisId, projectId, clipsGenerated }` | Clip analysis done |
| `clipgen:error` | `{ analysisId, error }` | Clip analysis failed |

---

## Error Format

All errors follow a consistent format:

```json
{
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Project not found"
}
```

Common error codes: `NOT_FOUND`, `NO_FILE`, `INVALID_MIME`, `FILE_TOO_LARGE`, `PROBE_FAILED`, `NO_TRANSCRIPTION`, `ALREADY_TRANSCRIBING`, `ALREADY_ANALYZING`, `ALREADY_PROCESSING`, `INVALID_FORMAT`, `NOT_READY`, `PATH_TRAVERSAL`, `INVALID_PATH`, `FORBIDDEN`, `NOT_IMPLEMENTED`
