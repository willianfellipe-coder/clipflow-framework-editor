import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import type { VideoMeta } from '@clip/shared';

const execFileAsync = promisify(execFile);

const ffmpeg = ffmpegPath as unknown as string;
const ffprobe = ffprobePath.path;

export class FFmpegService {
  /**
   * Extract metadata from a video file using ffprobe.
   */
  async probe(videoPath: string): Promise<VideoMeta> {
    const { stdout } = await execFileAsync(ffprobe, [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath,
    ]);

    const data = JSON.parse(stdout);
    const videoStream = data.streams?.find((s: Record<string, string>) => s.codec_type === 'video');
    const audioStream = data.streams?.find((s: Record<string, string>) => s.codec_type === 'audio');
    const format = data.format || {};

    // Parse fps from r_frame_rate (e.g., "30000/1001" or "30/1")
    let fps = 30;
    if (videoStream?.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
      if (den && den > 0) fps = Math.round((num / den) * 100) / 100;
    }

    return {
      duration: parseFloat(format.duration || '0'),
      width: parseInt(videoStream?.width || '0', 10),
      height: parseInt(videoStream?.height || '0', 10),
      fps,
      codec: videoStream?.codec_name || 'unknown',
      bitrate: parseInt(format.bit_rate || '0', 10),
      audioCodec: audioStream?.codec_name || 'none',
      audioRate: parseInt(audioStream?.sample_rate || '0', 10),
    };
  }

  /**
   * Extract audio track as 16kHz mono WAV (optimal for WhisperX).
   */
  async extractAudio(videoPath: string, outputPath: string): Promise<string> {
    await execFileAsync(ffmpeg, [
      '-i', videoPath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      '-y',
      outputPath,
    ]);
    return outputPath;
  }

  /**
   * Generate a thumbnail JPEG at a specific timestamp.
   */
  async thumbnail(videoPath: string, timestamp: number, outputPath: string): Promise<string> {
    await execFileAsync(ffmpeg, [
      '-i', videoPath,
      '-ss', String(timestamp),
      '-vframes', '1',
      '-q:v', '2',
      '-y',
      outputPath,
    ]);
    return outputPath;
  }
}

export const ffmpegService = new FFmpegService();
