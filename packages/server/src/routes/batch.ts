import type { FastifyInstance } from 'fastify';
import { existsSync } from 'fs';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { batchJobs, batchItems } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { batchService } from '../services/batch.service.js';
import { AppError } from '../utils/errors.js';

export async function batchRoutes(app: FastifyInstance) {
  // Create batch job
  app.post<{
    Body: {
      name: string;
      videoPaths: string[];
      templateId?: string;
      captionStyleId?: string;
      formats?: string[];
      settings?: Record<string, unknown>;
    };
  }>('/api/batch', async (request, reply) => {
    const { name, videoPaths, templateId, captionStyleId, formats, settings } = request.body;

    if (!videoPaths || videoPaths.length === 0) {
      throw new AppError(400, 'At least one video path is required', 'NO_VIDEOS');
    }

    // SEC-008: Validate video paths exist and are not traversal attempts
    for (const vp of videoPaths) {
      if (vp.includes('..') || vp.includes('\0')) {
        throw new AppError(400, `Invalid video path: ${vp}`, 'INVALID_PATH');
      }
      if (!existsSync(vp)) {
        throw new AppError(400, `Video file not found: ${vp}`, 'FILE_NOT_FOUND');
      }
    }

    const id = nanoid();
    const now = new Date();

    db.insert(batchJobs).values({
      id,
      name: name || `Batch ${new Date().toLocaleDateString()}`,
      status: 'pending',
      templateId: templateId || null,
      captionStyleId: captionStyleId || null,
      formats: JSON.stringify(formats || ['reel_9x16']),
      totalVideos: videoPaths.length,
      completedVideos: 0,
      failedVideos: 0,
      settings: settings ? JSON.stringify(settings) : null,
      createdAt: now,
    }).run();

    // Create batch items
    for (let i = 0; i < videoPaths.length; i++) {
      db.insert(batchItems).values({
        id: nanoid(),
        batchJobId: id,
        sourceVideoPath: videoPaths[i],
        status: 'pending',
        order: i + 1,
        createdAt: now,
      }).run();
    }

    const job = db.select().from(batchJobs).where(eq(batchJobs.id, id)).get();
    const items = db.select().from(batchItems).where(eq(batchItems.batchJobId, id)).orderBy(asc(batchItems.order)).all();

    return reply.status(201).send({ ...job, items });
  });

  // List batch jobs
  app.get('/api/batch', async () => {
    return db.select().from(batchJobs).all();
  });

  // Get batch job details with items
  app.get<{ Params: { id: string } }>('/api/batch/:id', async (request) => {
    const job = db.select().from(batchJobs).where(eq(batchJobs.id, request.params.id)).get();
    if (!job) throw new AppError(404, 'Batch job not found', 'NOT_FOUND');

    const items = db.select().from(batchItems)
      .where(eq(batchItems.batchJobId, job.id))
      .orderBy(asc(batchItems.order))
      .all();

    return { ...job, items };
  });

  // Start/resume batch processing
  app.post<{ Params: { id: string } }>('/api/batch/:id/start', async (request, reply) => {
    const job = db.select().from(batchJobs).where(eq(batchJobs.id, request.params.id)).get();
    if (!job) throw new AppError(404, 'Batch job not found', 'NOT_FOUND');

    if (job.status === 'processing') {
      throw new AppError(409, 'Batch already processing', 'ALREADY_PROCESSING');
    }

    reply.status(202).send({ message: 'Batch processing started', batchId: job.id });

    batchService.processBatch(job.id).catch((err) => {
      app.log.error(err, 'Batch processing failed');
      db.update(batchJobs).set({ status: 'error' }).where(eq(batchJobs.id, job.id)).run();
    });
  });

  // Pause batch processing
  app.post<{ Params: { id: string } }>('/api/batch/:id/pause', async (request) => {
    const job = db.select().from(batchJobs).where(eq(batchJobs.id, request.params.id)).get();
    if (!job) throw new AppError(404, 'Batch job not found', 'NOT_FOUND');

    db.update(batchJobs).set({ status: 'paused' }).where(eq(batchJobs.id, job.id)).run();
    return { message: 'Batch paused' };
  });

  // Delete/cancel batch job
  app.delete<{ Params: { id: string } }>('/api/batch/:id', async (request, reply) => {
    const job = db.select().from(batchJobs).where(eq(batchJobs.id, request.params.id)).get();
    if (!job) throw new AppError(404, 'Batch job not found', 'NOT_FOUND');

    // Mark as paused to stop processing
    db.update(batchJobs).set({ status: 'paused' }).where(eq(batchJobs.id, job.id)).run();

    // Delete items and job
    db.delete(batchItems).where(eq(batchItems.batchJobId, job.id)).run();
    db.delete(batchJobs).where(eq(batchJobs.id, job.id)).run();

    return reply.status(204).send();
  });
}
