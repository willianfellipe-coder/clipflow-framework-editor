import type { FastifyInstance } from 'fastify';

export async function sceneRoutes(app: FastifyInstance) {
  app.get('/api/projects/:id/scenes', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Scenes coming in Phase 3' });
  });

  app.put('/api/projects/:id/scenes', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Scenes coming in Phase 3' });
  });

  app.patch('/api/projects/:id/scenes/:sid', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Scenes coming in Phase 3' });
  });

  app.post('/api/projects/:id/scenes/reorder', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Scenes coming in Phase 3' });
  });

  app.post('/api/projects/:id/scenes/auto-cut', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Scenes coming in Phase 3' });
  });
}
