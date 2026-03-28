import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

export const config = {
  port: parseInt(process.env.PORT || '4400', 10),
  appPort: parseInt(process.env.APP_PORT || '4401', 10),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  hfToken: process.env.HF_TOKEN || '',
};

export const PATHS = {
  root,
  data: resolve(root, 'data'),
  db: resolve(root, 'data/db/clipflow.db'),
  uploads: resolve(root, 'data/uploads'),
  audio: resolve(root, 'data/audio'),
  transcriptions: resolve(root, 'data/transcriptions'),
  renders: resolve(root, 'data/renders'),
  templates: resolve(root, 'data/templates'),
  appDist: resolve(root, 'packages/app/dist'),
};

// Ensure data directories exist
for (const dir of [PATHS.uploads, PATHS.audio, PATHS.transcriptions, PATHS.renders, PATHS.templates]) {
  mkdirSync(dir, { recursive: true });
}
mkdirSync(resolve(root, 'data/db'), { recursive: true });

// Startup warnings for missing config
if (!config.anthropicApiKey) {
  console.warn('[WARN] ANTHROPIC_API_KEY not set — AI analysis will not work');
}
if (!config.hfToken) {
  console.warn('[WARN] HF_TOKEN not set — speaker diarization disabled');
}
