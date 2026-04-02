import type { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { scenes, projects } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { parseJsonField, ZoomConfigSchema } from '../db/validators.js';
import { z } from 'zod';

export async function sceneRoutes(app: FastifyInstance) {
  // List scenes for a project
  app.get<{ Params: { id: string } }>('/api/projects/:id/scenes', async (request) => {
    const rows = db.select().from(scenes)
      .where(eq(scenes.projectId, request.params.id))
      .orderBy(asc(scenes.order))
      .all();

    return rows.map((r) => ({
      ...r,
      effects: parseJsonField(z.array(z.string()), r.effects, []),
      zoomConfig: parseJsonField(ZoomConfigSchema, r.zoomConfig, null),
    }));
  });

  // Replace all scenes
  app.put<{
    Params: { id: string };
    Body: { scenes: { order: number; startTime: number; endTime: number; type: string; description?: string; effects?: string[]; transitionIn?: string; transitionOut?: string }[] };
  }>('/api/projects/:id/scenes', async (request) => {
    const project = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    if (!project) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    const now = new Date();

    // DAT-003: Use transaction — delete + insert must be atomic.
    // If insert fails mid-way, the delete is rolled back so the project keeps its scenes.
    db.transaction((tx) => {
      tx.delete(scenes).where(eq(scenes.projectId, project.id)).run();

      for (const scene of request.body.scenes) {
        tx.insert(scenes).values({
          id: nanoid(),
          projectId: project.id,
          order: scene.order,
          startTime: scene.startTime,
          endTime: scene.endTime,
          type: scene.type as 'hook' | 'content' | 'transition' | 'broll' | 'cta' | 'outro',
          description: scene.description || null,
          effects: scene.effects ? JSON.stringify(scene.effects) : null,
          transitionIn: scene.transitionIn || 'cut',
          transitionOut: scene.transitionOut || 'cut',
          isActive: true,
          createdAt: now,
        }).run();
      }
    });

    return db.select().from(scenes)
      .where(eq(scenes.projectId, project.id))
      .orderBy(asc(scenes.order))
      .all();
  });

  // Update single scene
  app.patch<{
    Params: { id: string; sid: string };
    Body: Record<string, unknown>;
  }>('/api/projects/:id/scenes/:sid', async (request) => {
    const scene = db.select().from(scenes).where(eq(scenes.id, request.params.sid)).get();
    if (!scene) throw new AppError(404, 'Scene not found', 'NOT_FOUND');

    const updates: Record<string, unknown> = {};
    const body = request.body;

    if (body.startTime !== undefined) updates.startTime = body.startTime;
    if (body.endTime !== undefined) updates.endTime = body.endTime;
    if (body.type !== undefined) updates.type = body.type;
    if (body.description !== undefined) updates.description = body.description;
    if (body.effects !== undefined) updates.effects = JSON.stringify(body.effects);
    if (body.zoomConfig !== undefined) updates.zoomConfig = JSON.stringify(body.zoomConfig);
    if (body.transitionIn !== undefined) updates.transitionIn = body.transitionIn;
    if (body.transitionOut !== undefined) updates.transitionOut = body.transitionOut;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.captionText !== undefined) updates.captionText = body.captionText;

    if (Object.keys(updates).length > 0) {
      db.update(scenes).set(updates).where(eq(scenes.id, request.params.sid)).run();
    }

    const updated = db.select().from(scenes).where(eq(scenes.id, request.params.sid)).get();
    return {
      ...updated,
      effects: parseJsonField(z.array(z.string()), updated!.effects, []),
      zoomConfig: parseJsonField(ZoomConfigSchema, updated!.zoomConfig, null),
    };
  });

  // Reorder scenes
  app.post<{
    Params: { id: string };
    Body: { sceneIds: string[] };
  }>('/api/projects/:id/scenes/reorder', async (request) => {
    const { sceneIds } = request.body;

    for (let i = 0; i < sceneIds.length; i++) {
      db.update(scenes)
        .set({ order: i + 1 })
        .where(eq(scenes.id, sceneIds[i]))
        .run();
    }

    return db.select().from(scenes)
      .where(eq(scenes.projectId, request.params.id))
      .orderBy(asc(scenes.order))
      .all();
  });

  // Auto-cut (re-analyze)
  app.post<{ Params: { id: string } }>('/api/projects/:id/scenes/auto-cut', async (_request, reply) => {
    return reply.status(501).send({
      error: 'NOT_IMPLEMENTED',
      message: 'Auto-cut uses the analysis endpoint. POST /api/projects/:id/analyze',
    });
  });
}
