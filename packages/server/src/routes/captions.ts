import type { FastifyInstance } from 'fastify';

export async function captionRoutes(app: FastifyInstance) {
  app.get('/api/projects/:id/captions', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Captions coming in Phase 5' });
  });

  app.put('/api/projects/:id/captions', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Captions coming in Phase 5' });
  });

  app.get('/api/caption-styles', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Caption styles coming in Phase 5' });
  });

  app.post('/api/caption-styles', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Caption styles coming in Phase 5' });
  });

  app.patch('/api/caption-styles/:id', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Caption styles coming in Phase 5' });
  });
}
