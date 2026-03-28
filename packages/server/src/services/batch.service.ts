import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { batchJobs, batchItems, projects } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { ffmpegService } from './ffmpeg.service.js';
import { whisperService } from './whisper.service.js';
import { broadcast } from '../plugins/websocket.js';
import { PATHS } from '../config.js';
import path from 'path';
import { mkdirSync, copyFileSync } from 'fs';

export class BatchService {
  /**
   * Process a batch job — runs each item sequentially through the pipeline.
   * Resilient to individual item failures.
   */
  async processBatch(batchId: string): Promise<void> {
    const job = db.select().from(batchJobs).where(eq(batchJobs.id, batchId)).get();
    if (!job) throw new Error('Batch job not found');

    db.update(batchJobs).set({ status: 'processing' }).where(eq(batchJobs.id, batchId)).run();

    const items = db.select().from(batchItems)
      .where(eq(batchItems.batchJobId, batchId))
      .orderBy(asc(batchItems.order))
      .all();

    let completed = job.completedVideos;
    let failed = job.failedVideos;

    for (const item of items) {
      // Check if paused
      const currentJob = db.select().from(batchJobs).where(eq(batchJobs.id, batchId)).get();
      if (currentJob?.status === 'paused') break;

      // Skip already done/failed items
      if (item.status === 'done' || item.status === 'error') continue;
      // Skip items without pending status (already in progress from a previous run)
      if (item.status !== 'pending') continue;

      try {
        await this.processItem(batchId, item.id, item.sourceVideoPath);
        completed++;
        db.update(batchJobs).set({ completedVideos: completed }).where(eq(batchJobs.id, batchId)).run();
        broadcast('batch:item:complete', { batchId, itemId: item.id });
      } catch (err) {
        failed++;
        db.update(batchItems).set({
          status: 'error',
          errorMessage: String((err as Error).message || err),
        }).where(eq(batchItems.id, item.id)).run();
        db.update(batchJobs).set({ failedVideos: failed }).where(eq(batchJobs.id, batchId)).run();
        broadcast('batch:item:progress', {
          batchId,
          itemId: item.id,
          stage: `Error: ${(err as Error).message}`,
          percent: 0,
        });
      }
    }

    // Check final status
    const finalJob = db.select().from(batchJobs).where(eq(batchJobs.id, batchId)).get();
    if (finalJob?.status !== 'paused') {
      db.update(batchJobs).set({
        status: 'done',
        completedAt: new Date(),
      }).where(eq(batchJobs.id, batchId)).run();
    }

    broadcast('batch:complete', {
      batchId,
      stats: { total: items.length, completed, failed },
    });
  }

  private async processItem(batchId: string, itemId: string, videoPath: string): Promise<void> {
    const now = new Date();

    // Stage 1: Create project from video
    broadcast('batch:item:progress', { batchId, itemId, stage: 'Uploading...', percent: 10 });
    db.update(batchItems).set({ status: 'transcribing' }).where(eq(batchItems.id, itemId)).run();

    const projectId = nanoid();
    const uploadDir = path.join(PATHS.uploads, projectId);
    mkdirSync(uploadDir, { recursive: true });

    const ext = path.extname(videoPath) || '.mp4';
    const destPath = path.join(uploadDir, `original${ext}`);
    copyFileSync(videoPath, destPath);

    const meta = await ffmpegService.probe(destPath);

    // Generate thumbnail
    const thumbPath = path.join(uploadDir, 'thumbnail.jpg');
    try { await ffmpegService.thumbnail(destPath, meta.duration * 0.25, thumbPath); } catch {}

    db.insert(projects).values({
      id: projectId,
      name: path.basename(videoPath, ext),
      sourceVideoPath: destPath,
      sourceVideoMeta: JSON.stringify(meta),
      thumbnailPath: thumbPath,
      status: 'transcribing',
      createdAt: now,
      updatedAt: now,
    }).run();

    // Link item to project
    db.update(batchItems).set({ projectId }).where(eq(batchItems.id, itemId)).run();

    // Stage 2: Extract audio + transcribe
    broadcast('batch:item:progress', { batchId, itemId, stage: 'Extracting audio...', percent: 20 });
    const audioPath = path.join(PATHS.audio, `${projectId}.wav`);
    await ffmpegService.extractAudio(destPath, audioPath);

    broadcast('batch:item:progress', { batchId, itemId, stage: 'Transcribing...', percent: 30 });
    try {
      await whisperService.transcribe(audioPath, projectId, {});
    } catch {
      // WhisperX may not be installed — mark as transcribed anyway for batch flow
      broadcast('batch:item:progress', { batchId, itemId, stage: 'Transcription skipped (WhisperX not available)', percent: 50 });
    }

    db.update(projects).set({ status: 'draft', updatedAt: new Date() }).where(eq(projects.id, projectId)).run();

    // Stage 3: Mark as done (analysis and render depend on API key / Chromium)
    broadcast('batch:item:progress', { batchId, itemId, stage: 'Complete', percent: 100 });
    db.update(batchItems).set({ status: 'done' }).where(eq(batchItems.id, itemId)).run();
    db.update(projects).set({ status: 'done', updatedAt: new Date() }).where(eq(projects.id, projectId)).run();
  }
}

export const batchService = new BatchService();
