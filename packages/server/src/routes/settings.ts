import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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
    return {
      node: process.version,
      platform: process.platform,
      ffmpeg: false,
      whisperx: false,
      database: true,
    };
  });
}
