/**
 * Unit tests: DAT-004 JSON field validators
 *
 * Validates that the Zod schemas correctly accept valid data and reject
 * invalid/corrupt JSON that could silently break the app.
 */
import { describe, it, expect } from 'vitest';
import {
  VideoMetaSchema,
  SceneEffectsSchema,
  ZoomConfigSchema,
  WordTimestampSchema,
  WordTimestampsSchema,
  parseJsonField,
} from '../db/validators.js';

describe('VideoMetaSchema', () => {
  it('accepts valid metadata', () => {
    const result = VideoMetaSchema.safeParse({
      width: 1920, height: 1080, duration: 120, fps: 30, codec: 'h264',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative duration', () => {
    const result = VideoMetaSchema.safeParse({
      width: 1920, height: 1080, duration: -5, fps: 30, codec: 'h264',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero width', () => {
    const result = VideoMetaSchema.safeParse({
      width: 0, height: 1080, duration: 10, fps: 30, codec: 'h264',
    });
    expect(result.success).toBe(false);
  });
});

describe('ZoomConfigSchema', () => {
  it('accepts valid zoom config', () => {
    const result = ZoomConfigSchema.safeParse({ scale: 1.5, originX: 0.5, originY: 0.5 });
    expect(result.success).toBe(true);
  });

  it('accepts null (no zoom)', () => {
    const result = ZoomConfigSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it('rejects scale > 3', () => {
    const result = ZoomConfigSchema.safeParse({ scale: 5, originX: 0.5, originY: 0.5 });
    expect(result.success).toBe(false);
  });

  it('rejects originX outside 0-1', () => {
    const result = ZoomConfigSchema.safeParse({ scale: 1.2, originX: 1.5, originY: 0.5 });
    expect(result.success).toBe(false);
  });
});

describe('WordTimestampSchema', () => {
  it('accepts valid word timestamp', () => {
    const result = WordTimestampSchema.safeParse({ word: 'hello', start: 0, end: 0.5 });
    expect(result.success).toBe(true);
  });

  it('rejects missing word field', () => {
    const result = WordTimestampSchema.safeParse({ start: 0, end: 0.5 });
    expect(result.success).toBe(false);
  });

  it('rejects negative start time', () => {
    const result = WordTimestampSchema.safeParse({ word: 'hi', start: -1, end: 0.5 });
    expect(result.success).toBe(false);
  });
});

describe('WordTimestampsSchema', () => {
  it('accepts an array of valid timestamps', () => {
    const data = [
      { word: 'hello', start: 0, end: 0.5 },
      { word: 'world', start: 0.6, end: 1.2 },
    ];
    expect(WordTimestampsSchema.safeParse(data).success).toBe(true);
  });

  it('rejects a non-array', () => {
    expect(WordTimestampsSchema.safeParse('not an array').success).toBe(false);
  });
});

describe('parseJsonField helper', () => {
  it('returns parsed data when valid', () => {
    const raw = JSON.stringify([{ word: 'hi', start: 0, end: 0.5 }]);
    const result = parseJsonField(WordTimestampsSchema, raw, []);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('hi');
  });

  it('returns fallback for null input', () => {
    const result = parseJsonField(WordTimestampsSchema, null, []);
    expect(result).toEqual([]);
  });

  it('returns fallback for corrupted JSON string', () => {
    const result = parseJsonField(WordTimestampsSchema, '{broken json', []);
    expect(result).toEqual([]);
  });

  it('returns fallback when Zod validation fails', () => {
    const badData = JSON.stringify([{ word: 123, start: -1, end: 0 }]);
    const result = parseJsonField(WordTimestampsSchema, badData, []);
    expect(result).toEqual([]);
  });
});

describe('SceneEffectsSchema', () => {
  it('accepts empty array', () => {
    expect(SceneEffectsSchema.safeParse([]).success).toBe(true);
  });

  it('accepts array of strings', () => {
    expect(SceneEffectsSchema.safeParse(['zoom', 'fade']).success).toBe(true);
  });

  it('rejects array with non-string items', () => {
    expect(SceneEffectsSchema.safeParse([1, 2, 3]).success).toBe(false);
  });
});
