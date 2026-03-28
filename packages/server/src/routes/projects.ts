import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { projects } from '../db/schema.js';
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

  // Delete project
  app.delete<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
    const existing = db.select().from(projects).where(eq(projects.id, request.params.id)).get();
    if (!existing) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    db.delete(projects).where(eq(projects.id, request.params.id)).run();
    return reply.status(204).send();
  });
}
