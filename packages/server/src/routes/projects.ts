import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { projects, templates, scenes } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { AppError } from '../utils/errors.js';

export async function projectRoutes(app: FastifyInstance) {
  // List projects
  app.get('/api/projects', async () => {
    const rows = db.select().from(projects).orderBy(projects.createdAt).all();
    return rows;
  });

  // Get project by ID
  app.get<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
    const row = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    if (!row) throw new AppError(404, 'Project not found', 'NOT_FOUND');
    return row;
  });

  // Create project
  app.post<{ Body: { name: string; description?: string; sourceVideoPath?: string } }>(
    '/api/projects',
    async (request) => {
      const now = new Date();
      const id = nanoid();
      const { name, description, sourceVideoPath } = request.body;

      db.insert(projects).values({
        id,
        name,
        description: description || null,
        sourceVideoPath: sourceVideoPath || '',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      }).run();

      return db.select().from(projects).where(eq(projects.id, id)).get();
    },
  );

  // Update project
  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/api/projects/:id',
    async (request) => {
      const existing = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
      if (!existing) throw new AppError(404, 'Project not found', 'NOT_FOUND');

      db.update(projects)
        .set({ ...request.body, updatedAt: new Date() } as Record<string, unknown>)
        .where(eq(projects.id, request.params.id))
        .run();

      return db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    },
  );

  // Apply template to project
  app.post<{
    Params: { id: string };
    Body: { templateId: string };
  }>('/api/projects/:id/apply-template', async (request) => {
    const project = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    if (!project) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    const template = db.select().from(templates).where(eq(templates.id, request.body.templateId)).get();
    if (!template) throw new AppError(404, 'Template not found', 'NOT_FOUND');

    const now = new Date();

    // Update project with template reference
    db.update(projects).set({
      templateId: template.id,
      nicheId: template.niche,
      updatedAt: now,
    }).where(eq(projects.id, project.id)).run();

    // Apply template defaults to existing scenes
    const projectScenes = db.select().from(scenes).where(eq(scenes.projectId, project.id)).all();

    if (projectScenes.length > 0) {
      const effects = template.defaultEffects || '[]';
      const transitions = template.defaultTransitions ? JSON.parse(template.defaultTransitions) : ['cut'];
      const defaultTransition = transitions[0] || 'cut';

      for (const scene of projectScenes) {
        db.update(scenes).set({
          effects,
          transitionIn: defaultTransition,
          transitionOut: defaultTransition,
        }).where(eq(scenes.id, scene.id)).run();
      }
    }

    // Increment usage count
    db.update(templates).set({
      usageCount: (template.usageCount || 0) + 1,
      updatedAt: now,
    }).where(eq(templates.id, template.id)).run();

    return db.select().from(projects).where(eq(projects.id, project.id)).get();
  });

  // Delete project
  app.delete<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
    const existing = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    if (!existing) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    db.delete(projects).where(eq(projects.id, request.params.id)).run();
    return reply.status(204).send();
  });
}
