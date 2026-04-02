import type { FastifyInstance } from 'fastify';
import path from 'path';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { projects, transcriptions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { PATHS } from '../config.js';
import { ffmpegService } from '../services/ffmpeg.service.js';
import { whisperService } from '../services/whisper.service.js';
import { broadcast } from '../plugins/websocket.js';
import { AppError } from '../utils/errors.js';
import { WordTimestampsSchema, SegmentsSchema, parseJsonField } from '../db/validators.js';

export async function transcriptionRoutes(app: FastifyInstance) {
  // Trigger transcription
  app.post<{
    Params: { id: string };
    Body: { model?: string; language?: string };
  }>('/api/projects/:id/transcribe', async (request, reply) => {
    const project = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    if (!project) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    // Check if already transcribing
    if (project.status === 'transcribing') {
      throw new AppError(409, 'Transcription already in progress', 'ALREADY_TRANSCRIBING');
    }

    // Update project status
    db.update(projects)
      .set({ status: 'transcribing', updatedAt: new Date() })
      .where(eq(projects.id, project.id))
      .run();

    // Respond immediately, process in background
    reply.status(202).send({ message: 'Transcription started', projectId: project.id });

    // Run transcription in background
    processTranscription(project.id, project.sourceVideoPath, request.body || {}).catch((err) => {
      app.log.error(err, 'Transcription failed');
      db.update(projects)
        .set({ status: 'error', updatedAt: new Date() })
        .where(eq(projects.id, project.id))
        .run();
      broadcast('transcription:error', { projectId: project.id, error: String(err) });
    });
  });

  // Get transcription result
  app.get<{ Params: { id: string } }>('/api/projects/:id/transcription', async (request) => {
    const rows = db.select().from(transcriptions)
      .where(eq(transcriptions.projectId, request.params.id))
      .all();

    if (rows.length === 0) {
      throw new AppError(404, 'No transcription found for this project', 'NOT_FOUND');
    }

    // Return the most recent transcription
    const latest = rows[rows.length - 1];
    return {
      ...latest,
      wordTimestamps: parseJsonField(WordTimestampsSchema, latest.wordTimestamps, []),
      segments: parseJsonField(SegmentsSchema, latest.segments, []),
    };
  });
}

async function processTranscription(
  projectId: string,
  videoPath: string,
  options: { model?: string; language?: string },
) {
  const startTime = Date.now();

  // 1. Extract audio
  const audioPath = path.join(PATHS.audio, `${projectId}.wav`);
  broadcast('transcription:progress', { projectId, percent: 5, currentSegment: 'Extracting audio...' });
  await ffmpegService.extractAudio(videoPath, audioPath);

  // 2. Run WhisperX
  broadcast('transcription:progress', { projectId, percent: 10, currentSegment: 'Starting transcription...' });
  const result = await whisperService.transcribe(audioPath, projectId, options);

  // 3. Build full text from segments
  const fullText = result.segments.map((s) => s.text).join(' ').trim();
  const duration = result.word_timestamps.length > 0
    ? result.word_timestamps[result.word_timestamps.length - 1].end
    : 0;

  // 4. Save to DB
  const transcriptionId = nanoid();
  const now = new Date();
  const processingTime = (Date.now() - startTime) / 1000;

  db.insert(transcriptions).values({
    id: transcriptionId,
    projectId,
    model: options.model || 'large-v3',
    language: result.language || null,
    fullText,
    wordTimestamps: JSON.stringify(result.word_timestamps),
    segments: JSON.stringify(result.segments),
    duration,
    processingTime,
    createdAt: now,
  }).run();

  // 5. Update project status
  db.update(projects)
    .set({ status: 'draft', updatedAt: now })
    .where(eq(projects.id, projectId))
    .run();

  // 6. Broadcast completion
  broadcast('transcription:complete', { projectId, transcriptionId });
}
