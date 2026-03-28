import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { PATHS } from '../config.js';
import { existsSync } from 'fs';

export async function registerStatic(app: FastifyInstance) {
  // Serve uploaded files and renders
  if (existsSync(PATHS.uploads)) {
    await app.register(fastifyStatic, {
      root: PATHS.data,
      prefix: '/static/',
      decorateReply: true,
    });
  }
}
