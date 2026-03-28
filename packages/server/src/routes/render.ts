import type { FastifyInstance } from 'fastify';

export async function renderRoutes(app: FastifyInstance) {
  app.post('/api/projects/:id/render', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Rendering coming in Phase 7' });
  });

  app.post('/api/projects/:id/render/multi', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Multi-render coming in Phase 7' });
  });

  app.get('/api/renders/:id', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Render status coming in Phase 7' });
  });

  app.get('/api/renders/:id/download', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Render download coming in Phase 7' });
  });

  app.post('/api/renders/:id/cancel', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Render cancel coming in Phase 7' });
  });
}
