import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { createWriteStream, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { projects } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { PATHS } from '../config.js';
import { ffmpegService } from '../services/ffmpeg.service.js';
import { broadcast } from '../plugins/websocket.js';
import { AppError } from '../utils/errors.js';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_MIMES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi'];
const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];

export async function uploadRoutes(app: FastifyInstance) {
  await app.register(multipart, {
    limits: { fileSize: MAX_FILE_SIZE },
  });

  app.post('/api/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      throw new AppError(400, 'No file uploaded', 'NO_FILE');
    }

    // Validate by mime type or file extension
    const mime = data.mimetype;
    const ext = path.extname(data.filename).toLowerCase();
    const isValidMime = mime.startsWith('video/') || ALLOWED_MIMES.includes(mime);
    const isValidExt = ALLOWED_EXTENSIONS.includes(ext);

    if (!isValidMime && !isValidExt) {
      throw new AppError(400, `Unsupported file type: ${mime}. Accepted: MP4, MOV, WebM, AVI`, 'INVALID_MIME');
    }

    const projectId = nanoid();
    const fileExt = path.extname(data.filename) || '.mp4';
    const uploadDir = path.join(PATHS.uploads, projectId);
    mkdirSync(uploadDir, { recursive: true });

    const videoPath = path.join(uploadDir, `original${fileExt}`);

    // Save file to disk
    await pipeline(data.file, createWriteStream(videoPath));

    // Check if file size limit was hit (Fastify truncates the stream)
    if (data.file.truncated) {
      throw new AppError(413, `File too large. Maximum size: 500MB`, 'FILE_TOO_LARGE');
    }

    // SEC-003: Validate magic bytes — reject files with faked MIME/extension
    const { readFileSync } = await import('fs');
    const magic = readFileSync(videoPath, { flag: 'r' }).slice(0, 12);
    const isMP4orMOV = magic[4] === 0x66 && magic[5] === 0x74 && magic[6] === 0x79 && magic[7] === 0x70; // ftyp box
    const isWebM = magic[0] === 0x1a && magic[1] === 0x45 && magic[2] === 0xdf && magic[3] === 0xa3;      // EBML
    const isAVI  = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46;      // RIFF
    const isMKV  = magic[0] === 0x1a && magic[1] === 0x45 && magic[2] === 0xdf && magic[3] === 0xa3;      // EBML (same as WebM)
    if (!isMP4orMOV && !isWebM && !isAVI && !isMKV) {
      const { unlinkSync } = await import('fs');
      try { unlinkSync(videoPath); } catch { /* best effort cleanup */ }
      throw new AppError(400, 'File content does not match a supported video format', 'INVALID_MAGIC_BYTES');
    }

    // Probe video metadata
    let meta;
    try {
      meta = await ffmpegService.probe(videoPath);
    } catch (err) {
      throw new AppError(422, `Could not read video file: ${err}`, 'PROBE_FAILED');
    }

    // Transcode if codec isn't h264 or if profile is incompatible with browsers
    // (e.g. iPhone records H.264 High 10 which is 10-bit — Chromium can't decode it)
    const INCOMPATIBLE_PROFILES = ['High 10', 'High 10 Intra', 'High 4:2:2', 'High 4:4:4 Predictive'];
    const needsTranscode = meta.codec !== 'h264' || INCOMPATIBLE_PROFILES.includes(meta.profile || '');
    let finalVideoPath = videoPath;
    if (needsTranscode) {
      const h264Path = path.join(uploadDir, 'original.mp4');
      try {
        broadcast('upload:transcoding', { projectId, percent: 0, message: 'Convertendo vídeo...' });
        await ffmpegService.transcodeToH264(videoPath, h264Path, (percent) => {
          broadcast('upload:transcoding', { projectId, percent, message: 'Convertendo vídeo...' });
        });
        broadcast('upload:transcoding', { projectId, percent: 100, message: 'Conversão concluída' });
        finalVideoPath = h264Path;
        meta = await ffmpegService.probe(h264Path);
      } catch {
        // Transcoding failed — keep original and hope for the best
      }
    }

    // Generate thumbnail at 25% of duration
    const thumbnailPath = path.join(uploadDir, 'thumbnail.jpg');
    try {
      await ffmpegService.thumbnail(finalVideoPath, meta.duration * 0.25, thumbnailPath);
    } catch {
      // Thumbnail is non-critical, continue without it
    }

    // Create project in DB
    const now = new Date();
    db.insert(projects).values({
      id: projectId,
      name: data.filename.replace(fileExt, ''),
      sourceVideoPath: finalVideoPath,
      sourceVideoMeta: JSON.stringify(meta),
      thumbnailPath,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }).run();

    const project = db.select().from(projects).where(eq(projects.id, projectId)).get();

    return reply.status(201).send(project);
  });
}
