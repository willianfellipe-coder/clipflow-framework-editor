import type { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { templates } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import { parseJsonField, CTAConfigSchema, LayoutConfigSchema } from '../db/validators.js';
import { z } from 'zod';

export async function templateRoutes(app: FastifyInstance) {
  // List templates
  app.get('/api/templates', async () => {
    return db.select().from(templates).all();
  });

  // Get template by ID
  app.get<{ Params: { id: string } }>('/api/templates/:id', async (request) => {
    const row = db.select().from(templates).where(eq(templates.id, request.params.id)).get();
    if (!row) throw new AppError(404, 'Template not found', 'NOT_FOUND');
    return row;
  });

  // Create custom template
  app.post<{
    Body: {
      name: string;
      description?: string;
      niche: string;
      composition?: string;
      defaultEffects?: string[];
      defaultTransitions?: string[];
      colorPalette?: string[];
      hookConfig?: Record<string, unknown>;
      ctaConfig?: Record<string, unknown>;
      captionStyle?: string;
      pacing?: string;
    };
  }>('/api/templates', async (request, reply) => {
    const id = nanoid();
    const now = new Date();
    const body = request.body;

    db.insert(templates).values({
      id,
      name: body.name,
      description: body.description || null,
      niche: body.niche,
      isBuiltIn: false,
      isPublished: true,
      composition: body.composition || 'ReelComposition',
      defaultEffects: body.defaultEffects ? JSON.stringify(body.defaultEffects) : null,
      defaultTransitions: body.defaultTransitions ? JSON.stringify(body.defaultTransitions) : null,
      colorPalette: body.colorPalette ? JSON.stringify(body.colorPalette) : null,
      hookConfig: body.hookConfig ? JSON.stringify(body.hookConfig) : null,
      ctaConfig: body.ctaConfig ? JSON.stringify(body.ctaConfig) : null,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    }).run();

    return reply.status(201).send(
      db.select().from(templates).where(eq(templates.id, id)).get(),
    );
  });

  // Update template
  app.patch<{
    Params: { id: string };
    Body: Record<string, unknown>;
  }>('/api/templates/:id', async (request) => {
    const existing = db.select().from(templates).where(eq(templates.id, request.params.id)).get();
    if (!existing) throw new AppError(404, 'Template not found', 'NOT_FOUND');

    const updates: Record<string, unknown> = {};
    const body = request.body;

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.niche !== undefined) updates.niche = body.niche;
    if (body.composition !== undefined) updates.composition = body.composition;
    if (body.defaultEffects !== undefined) updates.defaultEffects = JSON.stringify(body.defaultEffects);
    if (body.defaultTransitions !== undefined) updates.defaultTransitions = JSON.stringify(body.defaultTransitions);
    if (body.colorPalette !== undefined) updates.colorPalette = JSON.stringify(body.colorPalette);
    if (body.hookConfig !== undefined) updates.hookConfig = JSON.stringify(body.hookConfig);
    if (body.ctaConfig !== undefined) updates.ctaConfig = JSON.stringify(body.ctaConfig);
    if (body.isPublished !== undefined) updates.isPublished = body.isPublished;

    updates.updatedAt = new Date();

    db.update(templates).set(updates).where(eq(templates.id, request.params.id)).run();
    return db.select().from(templates).where(eq(templates.id, request.params.id)).get();
  });

  // Delete template (only custom, not built-in)
  app.delete<{ Params: { id: string } }>('/api/templates/:id', async (request, reply) => {
    const existing = db.select().from(templates).where(eq(templates.id, request.params.id)).get();
    if (!existing) throw new AppError(404, 'Template not found', 'NOT_FOUND');
    if (existing.isBuiltIn) throw new AppError(403, 'Cannot delete built-in templates', 'FORBIDDEN');

    db.delete(templates).where(eq(templates.id, request.params.id)).run();
    return reply.status(204).send();
  });

  // Get template preview (parsed config summary)
  app.get<{ Params: { id: string } }>('/api/templates/:id/preview', async (request) => {
    const row = db.select().from(templates).where(eq(templates.id, request.params.id)).get();
    if (!row) throw new AppError(404, 'Template not found', 'NOT_FOUND');

    return {
      ...row,
      defaultEffects: parseJsonField(z.array(z.string()), row.defaultEffects, []),
      defaultTransitions: parseJsonField(z.array(z.string()), row.defaultTransitions, []),
      colorPalette: parseJsonField(z.array(z.string()), row.colorPalette, []),
      hookConfig: parseJsonField(z.any(), row.hookConfig, null),
      ctaConfig: parseJsonField(CTAConfigSchema, row.ctaConfig, null),
      musicConfig: parseJsonField(z.any(), row.musicConfig, null),
      layoutConfig: parseJsonField(LayoutConfigSchema, row.layoutConfig, null),
    };
  });
}
