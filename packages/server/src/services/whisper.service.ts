import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { PATHS } from '../config.js';
import { broadcast } from '../plugins/websocket.js';

interface WhisperOutput {
  language: string;
  segments: { text: string; start: number; end: number; speaker?: string }[];
  word_timestamps: { word: string; start: number; end: number; confidence: number; speaker?: string }[];
}

export class WhisperService {
  /**
   * Run WhisperX transcription as a child process.
   * Streams progress via WebSocket.
   */
  async transcribe(
    audioPath: string,
    projectId: string,
    options: { model?: string; language?: string } = {},
  ): Promise<WhisperOutput> {
    const outputPath = path.join(PATHS.transcriptions, `${projectId}.json`);
    const whisperScript = path.join(PATHS.root, 'whisper', 'transcribe.py');

    // Try to use the venv Python, fall back to system python3
    const venvPython = path.join(PATHS.root, 'whisper', '.venv', 'bin', 'python');
    const pythonCmd = 'python3';

    const args = [
      whisperScript,
      audioPath,
      outputPath,
      '--model', options.model || 'large-v3',
      ...(options.language && options.language !== 'auto' ? ['--language', options.language] : []),
    ];

    let lastPercent = 0;

    return new Promise((resolve, reject) => {
      // Try venv first, then system python
      let child: ReturnType<typeof spawn>;
      try {
        child = spawn(venvPython, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      } catch {
        child = spawn(pythonCmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      }

      // Parse stderr for progress
      child.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;

          // WhisperX outputs progress like "Detecting language..." or percentage lines
          // Try to extract a percentage
          const percentMatch = line.match(/(\d+)%/);
          if (percentMatch) {
            const percent = parseInt(percentMatch[1], 10);
            if (percent > lastPercent) {
              lastPercent = percent;
              broadcast('transcription:progress', {
                projectId,
                percent,
                currentSegment: line.trim(),
              });
            }
          } else {
            // Broadcast the status message as-is
            broadcast('transcription:progress', {
              projectId,
              percent: lastPercent,
              currentSegment: line.trim(),
            });
          }
        }
      });

      // Capture stdout for any additional output
      child.stdout?.on('data', () => {});

      child.on('error', (err) => {
        reject(new Error(`Failed to start WhisperX: ${err.message}`));
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`WhisperX exited with code ${code}`));
          return;
        }

        try {
          const result = JSON.parse(readFileSync(outputPath, 'utf-8')) as WhisperOutput;
          resolve(result);
        } catch (err) {
          reject(new Error(`Failed to parse WhisperX output: ${err}`));
        }
      });
    });
  }
}

export const whisperService = new WhisperService();
