import type { FastifyInstance } from 'fastify';
import path from 'path';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { PATHS } from '../config.js';

export async function settingsRoutes(app: FastifyInstance) {
  // Get all settings
  app.get('/api/settings', async () => {
    const rows = db.select().from(settings).all();
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  });

  // Update settings
  app.patch<{ Body: Record<string, string> }>('/api/settings', async (request) => {
    const now = new Date();
    for (const [key, value] of Object.entries(request.body)) {
      const existing = db.select().from(settings).where(eq(settings.key, key)).get();
      if (existing) {
        db.update(settings).set({ value, updatedAt: now }).where(eq(settings.key, key)).run();
      } else {
        db.insert(settings).values({ key, value, updatedAt: now }).run();
      }
    }
    return { ok: true };
  });

  // System check
  app.get('/api/settings/system-check', async () => {
    const { execSync } = await import('child_process');
    let ffmpegOk = false;
    let whisperxOk = false;
    let chromeOk = false;

    try { execSync('ffmpeg -version', { stdio: 'ignore' }); ffmpegOk = true; } catch {}

    // Check WhisperX in venv first, then system python
    const venvPy = path.resolve(PATHS.root, 'whisper', '.venv', 'bin', 'python');
    try { execSync(`"${venvPy}" -c "import whisperx"`, { stdio: 'ignore' }); whisperxOk = true; } catch {
      try { execSync('python3 -c "import whisperx"', { stdio: 'ignore' }); whisperxOk = true; } catch {}
    }

    const chromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
    ];
    const { existsSync } = await import('fs');
    chromeOk = chromePaths.some((p) => existsSync(p));

    const { aiProvider } = await import('../services/ai-provider.js');
    const aiStatus = aiProvider.getStatus();

    return {
      node: process.version,
      platform: process.platform,
      ffmpeg: ffmpegOk,
      whisperx: whisperxOk,
      chromium: chromeOk,
      database: true,
      ai: aiStatus,
    };
  });

  // AI provider status
  app.get('/api/settings/ai-status', async () => {
    const { aiProvider } = await import('../services/ai-provider.js');
    return aiProvider.getStatus();
  });

  // GAP-007: Health check for load balancers and monitoring
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() };
  });

  // MCP connection toggle (called by MCP server on startup or from UI)
  app.post<{ Body: { connected?: boolean } }>('/api/settings/mcp-connected', async (request) => {
    const { aiProvider } = await import('../services/ai-provider.js');
    const connected = request.body?.connected !== false; // default true
    aiProvider.setMcpConnected(connected);
    return aiProvider.getStatus();
  });

  // Server restart (for dev — tsx watch will auto-restart)
  app.post('/api/server/restart', async (_request, reply) => {
    reply.send({ message: 'Server restarting...' });
    setTimeout(() => process.exit(0), 500); // tsx watch auto-restarts
  });
}
