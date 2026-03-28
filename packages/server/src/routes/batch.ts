import type { FastifyInstance } from 'fastify';

export async function batchRoutes(app: FastifyInstance) {
  app.post('/api/batch', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Batch coming in Phase 8' });
  });

  app.get('/api/batch', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Batch coming in Phase 8' });
  });

  app.get('/api/batch/:id', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Batch coming in Phase 8' });
  });

  app.post('/api/batch/:id/start', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Batch coming in Phase 8' });
  });

  app.post('/api/batch/:id/pause', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Batch coming in Phase 8' });
  });

  app.delete('/api/batch/:id', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Batch coming in Phase 8' });
  });
}
