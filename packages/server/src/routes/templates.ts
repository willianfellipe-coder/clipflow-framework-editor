import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { templates } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';

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

  // Create template (stub)
  app.post('/api/templates', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Template creation coming in Phase 6' });
  });

  // Update template (stub)
  app.patch('/api/templates/:id', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Template update coming in Phase 6' });
  });

  // Delete template (stub)
  app.delete('/api/templates/:id', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Template deletion coming in Phase 6' });
  });

  // Preview template (stub)
  app.post('/api/templates/:id/preview', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Template preview coming in Phase 6' });
  });
}
