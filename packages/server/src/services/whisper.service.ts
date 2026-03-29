import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { PATHS } from '../config.js';
import { broadcast } from '../plugins/websocket.js';

interface WhisperOutput {
  language: string;
  segments: { text: string; start: number; end: number; speaker?: string }[];
  word_timestamps: { word: string; start: number; end: number; confidence: number; speaker?: string }[];
}

// Filter out Python noise (warnings, deprecation notices, internal paths)
const NOISE_FILTER = /UserWarning|FutureWarning|warnings\.warn|\/lib\/python|torch\.|torchaudio|PendingDeprecationWarning|pkg_resources|^\s*$/;

// Map WhisperX stderr patterns to friendly messages with base progress percentages
const STAGE_MAP: [RegExp, string, number][] = [
  [/Loading.*model/i,        'Carregando modelo de IA...', 15],
  [/Detecting language/i,     'Detectando idioma...', 20],
  [/Transcrib/i,              'Transcrevendo fala...', 30],
  [/Align/i,                  'Alinhando palavras...', 70],
  [/Diariz/i,                 'Identificando falantes...', 85],
  [/Sav|Writ/i,               'Finalizando...', 95],
];

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

    // Use venv Python (has WhisperX installed), fall back to system
    const venvPython = path.join(PATHS.root, 'whisper', '.venv', 'bin', 'python');
    const pythonCmd = existsSync(venvPython) ? venvPython : 'python3';

    const args = [
      whisperScript,
      audioPath,
      outputPath,
      '--model', options.model || 'base',
      ...(options.language && options.language !== 'auto' ? ['--language', options.language] : []),
    ];

    let lastPercent = 0;

    return new Promise((resolve, reject) => {
      const child = spawn(pythonCmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

      // Parse stderr for progress — filter noise, map to friendly messages
      let currentStageMessage = 'Iniciando transcrição...';

      child.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Skip Python noise (warnings, internal paths, etc.)
          if (NOISE_FILTER.test(trimmed)) continue;

          // Check for real percentage from WhisperX
          const percentMatch = trimmed.match(/(\d+)%/);
          if (percentMatch) {
            const percent = parseInt(percentMatch[1], 10);
            if (percent > lastPercent) {
              lastPercent = percent;
              broadcast('transcription:progress', {
                projectId,
                percent,
                currentSegment: currentStageMessage,
              });
            }
            continue;
          }

          // Check for known stage transitions
          const stage = STAGE_MAP.find(([pattern]) => pattern.test(trimmed));
          if (stage) {
            const [, message, basePercent] = stage;
            currentStageMessage = message;
            if (basePercent > lastPercent) {
              lastPercent = basePercent;
            }
            broadcast('transcription:progress', {
              projectId,
              percent: lastPercent,
              currentSegment: message,
            });
          }
          // Unknown lines are silently ignored — no raw Python text in UI
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
