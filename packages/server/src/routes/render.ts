import type { FastifyInstance } from 'fastify';
import path from 'path';
import { createReadStream, existsSync, statSync } from 'fs';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { projects, renders, scenes, transcriptions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { FORMAT_CONFIGS } from '@clip/shared';
import type { ExportFormat, QualityPreset } from '@clip/shared';
import { PATHS } from '../config.js';
import { remotionService } from '../services/remotion.service.js';
import { broadcast } from '../plugins/websocket.js';
import { AppError } from '../utils/errors.js';
import { parseJsonField, WordTimestampsSchema, CTAConfigSchema, LayoutConfigSchema, ZoomConfigSchema } from '../db/validators.js';

// Track active renders for cancellation
const activeRenders = new Map<string, { cancelled: boolean }>();

export async function renderRoutes(app: FastifyInstance) {
  // Start single format render
  app.post<{
    Params: { id: string };
    Body: { format: ExportFormat; quality?: QualityPreset };
  }>('/api/projects/:id/render', async (request, reply) => {
    const project = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    if (!project) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    const format = request.body.format || 'reel_9x16';
    const quality = request.body.quality || 'standard';
    const formatConfig = FORMAT_CONFIGS[format as keyof typeof FORMAT_CONFIGS];
    if (!formatConfig) throw new AppError(400, `Invalid format: ${format}`, 'INVALID_FORMAT');

    const renderId = nanoid();
    const now = new Date();

    db.insert(renders).values({
      id: renderId,
      projectId: project.id,
      format,
      status: 'queued',
      width: formatConfig.width,
      height: formatConfig.height,
      fps: formatConfig.fps,
      codec: 'h264',
      quality,
      progress: 0,
      createdAt: now,
    }).run();

    // Update project status
    db.update(projects).set({ status: 'rendering', updatedAt: now }).where(eq(projects.id, project.id)).run();

    reply.status(202).send({ message: 'Render started', renderId });

    // Background render
    processRender(project.id, renderId, format as ExportFormat, quality).catch((err) => {
      app.log.error(err, 'Render failed');
      db.update(renders).set({
        status: 'error',
        errorMessage: String(err.message || err),
      }).where(eq(renders.id, renderId)).run();
      broadcast('render:error', { renderId, error: String(err.message || err) });
    });
  });

  // Start multi-format render
  app.post<{
    Params: { id: string };
    Body: { formats: ExportFormat[]; quality?: QualityPreset };
  }>('/api/projects/:id/render/multi', async (request, reply) => {
    const project = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    if (!project) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    const formats = request.body.formats || ['reel_9x16'];
    const quality = request.body.quality || 'standard';
    const renderIds: string[] = [];
    const now = new Date();

    for (const format of formats) {
      const formatConfig = FORMAT_CONFIGS[format as keyof typeof FORMAT_CONFIGS];
      if (!formatConfig) continue;

      const renderId = nanoid();
      renderIds.push(renderId);

      db.insert(renders).values({
        id: renderId,
        projectId: project.id,
        format,
        status: 'queued',
        width: formatConfig.width,
        height: formatConfig.height,
        fps: formatConfig.fps,
        codec: 'h264',
        quality,
        progress: 0,
        createdAt: now,
      }).run();
    }

    db.update(projects).set({ status: 'rendering', updatedAt: now }).where(eq(projects.id, project.id)).run();

    reply.status(202).send({ message: 'Multi-render started', renderIds });

    // Process sequentially in background
    (async () => {
      for (let i = 0; i < formats.length; i++) {
        try {
          await processRender(project.id, renderIds[i], formats[i], quality);
        } catch (err) {
          db.update(renders).set({
            status: 'error',
            errorMessage: String((err as Error).message || err),
          }).where(eq(renders.id, renderIds[i])).run();
          broadcast('render:error', { renderId: renderIds[i], error: String((err as Error).message || err) });
        }
      }
      db.update(projects).set({ status: 'done', updatedAt: new Date() }).where(eq(projects.id, project.id)).run();
    })().catch(() => {});
  });

  // Get render status
  app.get<{ Params: { id: string } }>('/api/renders/:id', async (request) => {
    const render = db.select().from(renders).where(eq(renders.id, request.params.id)).get();
    if (!render) throw new AppError(404, 'Render not found', 'NOT_FOUND');
    return render;
  });

  // Download rendered video
  app.get<{ Params: { id: string } }>('/api/renders/:id/download', async (request, reply) => {
    const render = db.select().from(renders).where(eq(renders.id, request.params.id)).get();
    if (!render) throw new AppError(404, 'Render not found', 'NOT_FOUND');
    if (render.status !== 'done' || !render.outputPath) {
      throw new AppError(400, 'Render not complete', 'NOT_READY');
    }

    // SEC-002: Path traversal protection
    const resolvedPath = path.resolve(render.outputPath);
    const rendersDir = path.resolve(PATHS.renders);
    if (!resolvedPath.startsWith(rendersDir)) {
      throw new AppError(403, 'Access denied', 'PATH_TRAVERSAL');
    }

    if (!existsSync(resolvedPath)) {
      throw new AppError(404, 'Rendered file not found', 'FILE_NOT_FOUND');
    }

    const stat = statSync(resolvedPath);
    const filename = `clipflow_${render.format}_${render.id}.mp4`;

    return reply
      .header('Content-Type', 'video/mp4')
      .header('Content-Length', stat.size)
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(createReadStream(resolvedPath));
  });

  // Cancel render
  app.post<{ Params: { id: string } }>('/api/renders/:id/cancel', async (request) => {
    const render = db.select().from(renders).where(eq(renders.id, request.params.id)).get();
    if (!render) throw new AppError(404, 'Render not found', 'NOT_FOUND');

    const tracker = activeRenders.get(render.id);
    if (tracker) tracker.cancelled = true;

    db.update(renders).set({ status: 'error', errorMessage: 'Cancelled by user' })
      .where(eq(renders.id, render.id)).run();

    return { message: 'Render cancelled' };
  });

  // List renders for a project
  app.get<{ Params: { id: string } }>('/api/projects/:id/renders', async (request) => {
    return db.select().from(renders).where(eq(renders.projectId, request.params.id)).all();
  });
}

async function processRender(
  projectId: string,
  renderId: string,
  format: ExportFormat,
  quality: QualityPreset,
) {
  const startTime = Date.now();
  const tracker = { cancelled: false };
  activeRenders.set(renderId, tracker);

  try {
    // Update status
    db.update(renders).set({ status: 'rendering' }).where(eq(renders.id, renderId)).run();

    // Gather project data
    const project = db.select().from(projects).where(eq(projects.id, projectId)).get()!;
    const projectScenes = db.select().from(scenes).where(eq(scenes.projectId, projectId)).all();
    const transcription = db.select().from(transcriptions).where(eq(transcriptions.projectId, projectId)).get();

    const wordTimestamps = transcription ? parseJsonField(WordTimestampsSchema, transcription.wordTimestamps, []) : [];
    const captions = wordTimestamps.map((w: { word: string; start: number; end: number }) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));

    // Resolve template config for composition props
    let captionStyle = {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 48,
      fontWeight: '800',
      color: '#FFFFFF',
      highlightColor: '#FFD700',
      strokeColor: '#000000',
      strokeWidth: 4,
      position: 'bottom',
      maxWordsPerLine: 4,
    };
    let captionAnimation = 'word-highlight';
    let ctaConfig = undefined as { text: string; subtext?: string; duration: number } | undefined;
    let showProgressBar = format !== 'tiktok_9x16';

    // Load template config if project has one
    if (project.templateId) {
      const { templates: templatesTable, captionStyles: captionStylesTable } = await import('../db/schema.js');
      const template = db.select().from(templatesTable).where(eq(templatesTable.id, project.templateId)).get();

      if (template) {
        // Resolve caption style from template
        if (template.defaultCaptionStyleId) {
          const style = db.select().from(captionStylesTable).where(eq(captionStylesTable.id, template.defaultCaptionStyleId)).get();
          if (style) {
            captionStyle = {
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              color: style.color,
              highlightColor: style.highlightColor,
              strokeColor: style.strokeColor,
              strokeWidth: style.strokeWidth,
              position: style.position,
              maxWordsPerLine: style.maxWordsPerLine,
            };
            captionAnimation = style.animation;
          }
        }

        // Resolve CTA from template
        if (template?.ctaConfig) {
          const cta = parseJsonField(CTAConfigSchema, template.ctaConfig, null);
          if (cta?.enabled) {
            ctaConfig = {
              text: cta.text || 'Follow for more!',
              subtext: cta.subtext || '',
              duration: cta.durationSeconds || 3,
            };
          }
        }

        // Layout config
        if (template?.layoutConfig) {
          const layout = parseJsonField(LayoutConfigSchema, template.layoutConfig, null);
          if (layout && layout.showProgressBar !== undefined) showProgressBar = layout.showProgressBar;
        }
      }
    }

    const compositionProps = {
      videoSrc: `/static/uploads/${projectId}/original.mp4`,
      scenes: projectScenes.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        type: s.type,
        transitionIn: s.transitionIn || 'none',
        transitionOut: s.transitionOut || 'none',
        zoomConfig: parseJsonField(ZoomConfigSchema, s.zoomConfig, null),
      })),
      captions,
      captionStyle,
      captionAnimation,
      showProgressBar,
      ...(ctaConfig ? { cta: ctaConfig } : {}),
    };

    // Store composition props
    db.update(renders).set({ compositionProps: JSON.stringify(compositionProps) })
      .where(eq(renders.id, renderId)).run();

    // Render
    const result = await remotionService.render(
      projectId,
      format,
      compositionProps,
      quality,
      (progress) => {
        // DAT-001: Only update progress if still rendering (guard against race with cancel)
        db.update(renders)
          .set({ progress: progress.percent })
          .where(and(eq(renders.id, renderId), eq(renders.status, 'rendering')))
          .run();
        broadcast('render:progress', {
          renderId,
          percent: progress.percent,
          currentFrame: progress.currentFrame,
          totalFrames: progress.totalFrames,
          eta: 0,
        });
      },
    );

    // DAT-001: Only mark as done if still in 'rendering' state — prevents overwriting a 'cancelled' status.
    const renderTime = (Date.now() - startTime) / 1000;
    db.update(renders).set({
      status: 'done',
      outputPath: result.outputPath,
      fileSize: result.fileSize,
      renderTime,
      progress: 100,
      completedAt: new Date(),
    }).where(and(eq(renders.id, renderId), eq(renders.status, 'rendering'))).run();

    broadcast('render:complete', {
      renderId,
      outputPath: result.outputPath,
      fileSize: result.fileSize,
    });
  } finally {
    activeRenders.delete(renderId);
  }
}
