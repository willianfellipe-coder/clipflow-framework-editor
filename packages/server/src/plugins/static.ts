import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { PATHS } from '../config.js';

export async function registerStatic(app: FastifyInstance) {
  // Serve uploaded videos and thumbnails
  await app.register(fastifyStatic, {
    root: PATHS.uploads,
    prefix: '/static/uploads/',
    decorateReply: true,
  });

  // Serve rendered videos (separate plugin instance)
  await app.register(fastifyStatic, {
    root: PATHS.renders,
    prefix: '/static/renders/',
    decorateReply: false,
  });
}
