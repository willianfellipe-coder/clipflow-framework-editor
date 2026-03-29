import type { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { projects, transcriptions, clips, clipAnalyses, clipPresets } from '../db/schema.js';
import { eq, desc, asc } from 'drizzle-orm';
import { clipGenService } from '../services/clipgen.service.js';
import { broadcast } from '../plugins/websocket.js';
import { AppError } from '../utils/errors.js';
import type { ClipAnalysisRequest } from '@clip/shared';

export async function clipRoutes(app: FastifyInstance) {
  // ── Analysis ──────────────────────────────────────

  // Start clip analysis
  app.post<{
    Params: { projectId: string };
    Body: ClipAnalysisRequest;
  }>('/api/clips/analyze/:projectId', async (request, reply) => {
    const project = db.select().from(projects).where(eq(projects.id, request.params.projectId)).get();
    if (!project) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    const transcription = db.select().from(transcriptions)
      .where(eq(transcriptions.projectId, project.id)).get();
    if (!transcription) {
      throw new AppError(400, 'Transcription required before clip analysis', 'NO_TRANSCRIPTION');
    }

    const body = request.body;
    const analysisId = nanoid();
    const now = new Date();

    db.insert(clipAnalyses).values({
      id: analysisId,
      projectId: project.id,
      transcriptionId: transcription.id,
      targetDuration: body.targetDuration || 30,
      numberOfClips: body.numberOfClips || 5,
      targetPlatform: body.targetPlatform || 'tiktok',
      niche: body.niche || null,
      tone: body.tone || 'energetic',
      customInstructions: body.customInstructions || null,
      status: 'pending',
      createdAt: now,
    }).run();

    reply.status(202).send({ message: 'Clip analysis started', analysisId });

    // Background processing
    processClipAnalysis(analysisId, project, transcription, body).catch((err) => {
      app.log.error(err, 'Clip analysis failed');
      db.update(clipAnalyses).set({
        status: 'error',
        errorMessage: String((err as Error).message || err),
      }).where(eq(clipAnalyses.id, analysisId)).run();
      broadcast('clipgen:error', { analysisId, error: String((err as Error).message || err) });
    });
  });

  // List analyses for project
  app.get<{ Params: { projectId: string } }>('/api/clips/analyses/:projectId', async (request) => {
    return db.select().from(clipAnalyses)
      .where(eq(clipAnalyses.projectId, request.params.projectId))
      .orderBy(desc(clipAnalyses.createdAt))
      .all();
  });

  // ── Clips CRUD ────────────────────────────────────

  // List clips for project
  app.get<{ Params: { projectId: string } }>('/api/clips/:projectId', async (request) => {
    const rows = db.select().from(clips)
      .where(eq(clips.projectId, request.params.projectId))
      .orderBy(desc(clips.hookScore))
      .all();

    return rows.map((r) => ({
      ...r,
      suggestedHashtags: r.suggestedHashtags ? JSON.parse(r.suggestedHashtags) : [],
      zoomConfig: r.zoomConfig ? JSON.parse(r.zoomConfig) : null,
      ctaConfig: r.ctaConfig ? JSON.parse(r.ctaConfig) : null,
    }));
  });

  // Update single clip
  app.patch<{
    Params: { clipId: string };
    Body: Record<string, unknown>;
  }>('/api/clips/:clipId', async (request) => {
    const clip = db.select().from(clips).where(eq(clips.id, request.params.clipId)).get();
    if (!clip) throw new AppError(404, 'Clip not found', 'NOT_FOUND');

    const allowed = ['title', 'hookSentence', 'startTime', 'endTime', 'captionAnimation',
      'aspectRatio', 'quality', 'targetPlatform', 'orderIndex', 'showProgressBar'];
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of allowed) {
      if (request.body[field] !== undefined) updates[field] = request.body[field];
    }
    if (request.body.suggestedHashtags !== undefined) {
      updates.suggestedHashtags = JSON.stringify(request.body.suggestedHashtags);
    }
    if (request.body.zoomConfig !== undefined) {
      updates.zoomConfig = JSON.stringify(request.body.zoomConfig);
    }
    if (request.body.ctaConfig !== undefined) {
      updates.ctaConfig = JSON.stringify(request.body.ctaConfig);
    }

    db.update(clips).set(updates).where(eq(clips.id, request.params.clipId)).run();
    return db.select().from(clips).where(eq(clips.id, request.params.clipId)).get();
  });

  // Update clip status
  app.patch<{
    Params: { clipId: string };
    Body: { status: string };
  }>('/api/clips/:clipId/status', async (request) => {
    const clip = db.select().from(clips).where(eq(clips.id, request.params.clipId)).get();
    if (!clip) throw new AppError(404, 'Clip not found', 'NOT_FOUND');

    db.update(clips).set({
      status: request.body.status as 'selected' | 'rejected' | 'editing',
      updatedAt: new Date(),
    }).where(eq(clips.id, request.params.clipId)).run();

    return db.select().from(clips).where(eq(clips.id, request.params.clipId)).get();
  });

  // Bulk update clips
  app.put<{
    Params: { projectId: string };
    Body: { clipIds: string[]; updates: Record<string, unknown> };
  }>('/api/clips/:projectId/bulk', async (request) => {
    const { clipIds, updates: rawUpdates } = request.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (rawUpdates.status !== undefined) updates.status = rawUpdates.status;
    if (rawUpdates.quality !== undefined) updates.quality = rawUpdates.quality;
    if (rawUpdates.targetPlatform !== undefined) updates.targetPlatform = rawUpdates.targetPlatform;

    for (const clipId of clipIds) {
      db.update(clips).set(updates).where(eq(clips.id, clipId)).run();
    }

    return { updated: clipIds.length };
  });

  // Delete clip (soft — set status to rejected)
  app.delete<{ Params: { clipId: string } }>('/api/clips/:clipId', async (request) => {
    const clip = db.select().from(clips).where(eq(clips.id, request.params.clipId)).get();
    if (!clip) throw new AppError(404, 'Clip not found', 'NOT_FOUND');

    db.update(clips).set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(clips.id, request.params.clipId)).run();

    return { message: 'Clip rejected' };
  });

  // ── Presets ───────────────────────────────────────

  app.get('/api/clips/presets', async () => {
    return db.select().from(clipPresets).orderBy(asc(clipPresets.name)).all();
  });

  app.post<{ Body: Record<string, unknown> }>('/api/clips/presets', async (request, reply) => {
    const id = nanoid();
    const now = new Date();
    const b = request.body;

    db.insert(clipPresets).values({
      id,
      name: (b.name as string) || 'New Preset',
      description: (b.description as string) || null,
      targetDuration: (b.targetDuration as number) || 30,
      numberOfClips: (b.numberOfClips as number) || 5,
      targetPlatform: (b.targetPlatform as string) || 'tiktok',
      niche: (b.niche as string) || null,
      tone: (b.tone as string) || 'energetic',
      customInstructions: (b.customInstructions as string) || null,
      captionAnimation: (b.captionAnimation as string) || 'word-highlight',
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    }).run();

    return reply.status(201).send(db.select().from(clipPresets).where(eq(clipPresets.id, id)).get());
  });

  app.delete<{ Params: { presetId: string } }>('/api/clips/presets/:presetId', async (request, reply) => {
    db.delete(clipPresets).where(eq(clipPresets.id, request.params.presetId)).run();
    return reply.status(204).send();
  });
}

// ── Background processing ─────────────────────────

async function processClipAnalysis(
  analysisId: string,
  project: typeof projects.$inferSelect,
  transcription: typeof transcriptions.$inferSelect,
  analysisConfig: ClipAnalysisRequest,
) {
  db.update(clipAnalyses).set({ status: 'processing' }).where(eq(clipAnalyses.id, analysisId)).run();
  broadcast('clipgen:progress', { analysisId, stage: 'Analyzing transcription for viral moments...' });

  const segments = JSON.parse(transcription.segments);
  const wordTimestamps = JSON.parse(transcription.wordTimestamps);
  const meta = project.sourceVideoMeta ? JSON.parse(project.sourceVideoMeta) : { duration: 0, width: 1080, height: 1920 };

  const result = await clipGenService.analyzeForClips(
    { segments, wordTimestamps, language: transcription.language },
    analysisConfig,
    meta,
  );

  broadcast('clipgen:progress', { analysisId, stage: 'Creating clips from analysis...' });

  // Save clips to DB
  const now = new Date();
  for (let i = 0; i < result.clips.length; i++) {
    const c = result.clips[i];
    db.insert(clips).values({
      id: nanoid(),
      projectId: project.id,
      analysisId,
      startTime: c.startTime,
      endTime: c.endTime,
      title: c.title,
      hookSentence: c.hookSentence,
      hookScore: c.hookScore,
      emotionalTone: c.emotionalTone,
      suggestedHashtags: JSON.stringify(c.suggestedHashtags),
      aiReason: c.reason,
      status: 'suggested',
      orderIndex: i,
      targetPlatform: analysisConfig.targetPlatform || 'tiktok',
      createdAt: now,
      updatedAt: now,
    }).run();
  }

  // Update analysis
  db.update(clipAnalyses).set({
    status: 'done',
    rawResponse: JSON.stringify(result),
    clipsGenerated: result.clips.length,
    modelUsed: 'claude-sonnet-4-6',
    completedAt: now,
  }).where(eq(clipAnalyses.id, analysisId)).run();

  broadcast('clipgen:complete', {
    analysisId,
    projectId: project.id,
    clipsGenerated: result.clips.length,
  });
}
