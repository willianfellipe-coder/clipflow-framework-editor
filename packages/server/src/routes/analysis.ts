import type { FastifyInstance } from 'fastify';

export async function analysisRoutes(app: FastifyInstance) {
  app.post('/api/projects/:id/analyze', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Analysis coming in Phase 3' });
  });

  app.get('/api/projects/:id/analysis', async (_request, reply) => {
    return reply.status(501).send({ error: 'NOT_IMPLEMENTED', message: 'Analysis coming in Phase 3' });
  });
}
