import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import ffmpegPath from 'ffmpeg-static';
// @ts-ignore
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
  /**
   * Transcode video to H.264 MP4 (browser-compatible).
   * Needed for HEVC/MOV files from iPhones that Chrome can't play.
   */
  async transcodeToH264(
    inputPath: string,
    outputPath: string,
    onProgress?: (percent: number) => void,
  ): Promise<string> {
    // Get total duration for percentage calculation
    const meta = await this.probe(inputPath);
    const totalDuration = meta.duration;

    return new Promise((resolve, reject) => {
      const child = spawn(ffmpeg, [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        '-progress', 'pipe:1',
        '-y',
        outputPath,
      ]);

      child.stdout?.on('data', (data: Buffer) => {
        if (!onProgress || totalDuration <= 0) return;
        const match = data.toString().match(/out_time_us=(\d+)/);
        if (match) {
          const currentSec = parseInt(match[1], 10) / 1_000_000;
          const percent = Math.min(Math.round((currentSec / totalDuration) * 100), 99);
          onProgress(percent);
        }
      });

      child.on('error', reject);
      child.on('close', (code) => {
        if (code !== 0) reject(new Error(`FFmpeg transcode exited with code ${code}`));
        else resolve(outputPath);
      });
    });
  }
}

export const ffmpegService = new FFmpegService();
