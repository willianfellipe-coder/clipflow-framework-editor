import { z } from 'zod';
import type { WordTimestamp } from '@clip/shared';

/**
 * DAT-004: Centralised Zod schemas for JSON fields stored as TEXT in SQLite.
 *
 * Problem: SQLite stores JSON as plain TEXT. Without validation, any string
 * can be inserted, and the app silently breaks when it tries to JSON.parse()
 * a corrupt value at read time.
 *
 * Solution: Parse + validate at the boundary (route handler) before writing.
 * All JSON column schemas live here so changes propagate project-wide.
 */

// ── Video metadata (stored in projects.source_video_meta) ─────────────────
export const VideoMetaSchema = z.object({
  width:    z.number().int().positive(),
  height:   z.number().int().positive(),
  duration: z.number().positive(),
  fps:      z.number().positive(),
  codec:    z.string(),
  bitrate:  z.number().optional(),
  size:     z.number().optional(),
  profile:  z.string().optional(),
});
export type VideoMeta = z.infer<typeof VideoMetaSchema>;

// ── Scene effects array (stored in scenes.effects) ────────────────────────
export const SceneEffectsSchema = z.array(z.string()).default([]);

// ── Zoom config (stored in scenes.zoom_config) ────────────────────────────
export const ZoomConfigSchema = z.object({
  scale:   z.number().min(1).max(3),
  originX: z.number().min(0).max(1).default(0.5),
  originY: z.number().min(0).max(1).default(0.5),
}).nullable();

// ── Template CTA config (stored in templates.cta_config) ──────────────────
export const CTAConfigSchema = z.object({
  enabled:         z.boolean().default(false),
  text:            z.string().max(120).optional(),
  subtext:         z.string().max(200).optional(),
  durationSeconds: z.number().int().min(1).max(30).default(3),
});

// ── Template layout config (stored in templates.layout_config) ────────────
export const LayoutConfigSchema = z.object({
  showProgressBar: z.boolean().default(true),
  showWatermark:   z.boolean().default(false),
  padding:         z.number().min(0).max(100).default(0),
});

// ── Word timestamp (stored in transcriptions.word_timestamps) ─────────────
export const WordTimestampSchema = z.object({
  word:       z.string(),
  start:      z.number().min(0),
  end:        z.number().min(0),
  confidence: z.number().min(0).max(1).default(1),
  speaker:    z.string().optional(),
});
export const WordTimestampsSchema = z.array(WordTimestampSchema) as z.ZodType<WordTimestamp[]>;

// ── Transcription segment ─────────────────────────────────────────────────
export const SegmentSchema = z.object({
  id:    z.number().int(),
  start: z.number().min(0),
  end:   z.number().min(0),
  text:  z.string(),
});
export const SegmentsSchema = z.array(SegmentSchema);

// ── Project settings (stored in projects.settings) ────────────────────────
export const ProjectSettingsSchema = z.object({
  preferredFormat: z.enum(['reel_9x16', 'landscape_16x9', 'square_1x1', 'tiktok_9x16']).optional(),
  autoSave:        z.boolean().default(true),
}).default({});

// ── Helper: safe JSON parse + Zod validation ──────────────────────────────
export function parseJsonField<T>(
  schema: z.ZodType<T>,
  raw: string | null | undefined,
  fallback: T,
): T {
  if (!raw) return fallback;
  try {
    return schema.parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}
