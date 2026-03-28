import type { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { transcriptions, captionStyles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';

export async function captionRoutes(app: FastifyInstance) {
  // Get captions (word timestamps from transcription)
  app.get<{ Params: { id: string } }>('/api/projects/:id/captions', async (request) => {
    const row = db.select().from(transcriptions)
      .where(eq(transcriptions.projectId, request.params.id))
      .get();

    if (!row) throw new AppError(404, 'No transcription found', 'NOT_FOUND');

    return {
      projectId: request.params.id,
      wordTimestamps: JSON.parse(row.wordTimestamps),
      segments: JSON.parse(row.segments),
      language: row.language,
    };
  });

  // Update captions (modified word timestamps)
  app.put<{
    Params: { id: string };
    Body: { wordTimestamps: { word: string; start: number; end: number; confidence?: number }[] };
  }>('/api/projects/:id/captions', async (request) => {
    const row = db.select().from(transcriptions)
      .where(eq(transcriptions.projectId, request.params.id))
      .get();

    if (!row) throw new AppError(404, 'No transcription found', 'NOT_FOUND');

    db.update(transcriptions)
      .set({ wordTimestamps: JSON.stringify(request.body.wordTimestamps) })
      .where(eq(transcriptions.id, row.id))
      .run();

    return { ok: true };
  });

  // List caption style presets
  app.get('/api/caption-styles', async () => {
    return db.select().from(captionStyles).all();
  });

  // Create custom caption style
  app.post<{
    Body: {
      name: string;
      projectId?: string;
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: string;
      color?: string;
      highlightColor?: string;
      strokeColor?: string;
      strokeWidth?: number;
      position?: 'top' | 'center' | 'bottom';
      animation?: string;
      maxWordsPerLine?: number;
    };
  }>('/api/caption-styles', async (request, reply) => {
    const id = nanoid();
    const now = new Date();
    const body = request.body;

    db.insert(captionStyles).values({
      id,
      name: body.name,
      projectId: body.projectId || null,
      isPreset: false,
      fontFamily: body.fontFamily || 'Inter',
      fontSize: body.fontSize || 48,
      fontWeight: body.fontWeight || '800',
      color: body.color || '#FFFFFF',
      highlightColor: body.highlightColor || '#FFD700',
      strokeColor: body.strokeColor || '#000000',
      strokeWidth: body.strokeWidth || 4,
      position: body.position || 'bottom',
      animation: (body.animation as 'word-highlight') || 'word-highlight',
      maxWordsPerLine: body.maxWordsPerLine || 4,
      createdAt: now,
    }).run();

    return reply.status(201).send(
      db.select().from(captionStyles).where(eq(captionStyles.id, id)).get(),
    );
  });

  // Update caption style
  app.patch<{
    Params: { id: string };
    Body: Record<string, unknown>;
  }>('/api/caption-styles/:id', async (request) => {
    const existing = db.select().from(captionStyles).where(eq(captionStyles.id, request.params.id)).get();
    if (!existing) throw new AppError(404, 'Caption style not found', 'NOT_FOUND');

    const updates: Record<string, unknown> = {};
    const body = request.body;
    const fields = ['name', 'fontFamily', 'fontSize', 'fontWeight', 'color', 'highlightColor',
      'strokeColor', 'strokeWidth', 'position', 'animation', 'maxWordsPerLine',
      'backgroundColor', 'backgroundPadding', 'backgroundRadius', 'shadowConfig'];

    for (const field of fields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (Object.keys(updates).length > 0) {
      db.update(captionStyles).set(updates).where(eq(captionStyles.id, request.params.id)).run();
    }

    return db.select().from(captionStyles).where(eq(captionStyles.id, request.params.id)).get();
  });
}
