import Fastify from 'fastify';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { registerErrorHandler } from './utils/errors.js';
import { registerCors } from './plugins/cors.js';
import { registerWebSocket } from './plugins/websocket.js';
import { registerStatic } from './plugins/static.js';
import { registerSwagger } from './plugins/swagger.js';
import { projectRoutes } from './routes/projects.js';
import { settingsRoutes } from './routes/settings.js';
import { templateRoutes } from './routes/templates.js';
import { uploadRoutes } from './routes/upload.js';
import { transcriptionRoutes } from './routes/transcription.js';
import { analysisRoutes } from './routes/analysis.js';
import { sceneRoutes } from './routes/scenes.js';
import { captionRoutes } from './routes/captions.js';
import { renderRoutes } from './routes/render.js';
import { batchRoutes } from './routes/batch.js';
import { clipRoutes } from './routes/clips.js';
import { initializeDatabase } from './db/index.js';
import { seed } from './db/seed.js';

async function start() {
  // Initialize database tables
  initializeDatabase();

  const app = Fastify({
    logger: true,
    bodyLimit: 524288000, // 500MB for video uploads
  });

  // Error handler
  registerErrorHandler(app);

  // Plugins
  await registerCors(app);
  await registerWebSocket(app);
  await registerStatic(app);
  await registerSwagger(app);

  // Routes
  await app.register(projectRoutes);
  await app.register(settingsRoutes);
  await app.register(templateRoutes);
  await app.register(uploadRoutes);
  await app.register(transcriptionRoutes);
  await app.register(analysisRoutes);
  await app.register(sceneRoutes);
  await app.register(captionRoutes);
  await app.register(renderRoutes);
  await app.register(batchRoutes);
  await app.register(clipRoutes);

  // Seed database
  await seed();

  // Start server
  await app.listen({ port: config.port, host: '0.0.0.0' });
  logger.info(`Server running on http://localhost:${config.port}`);
  logger.info(`API docs at http://localhost:${config.port}/docs`);

  // Auto-open browser (only in dev)
  if (process.env.NODE_ENV !== 'production') {
    const open = await import('open');
    open.default(`http://localhost:${config.appPort}`).catch(() => {});
  }
}

start().catch((err) => {
  logger.error(err);
  process.exit(1);
});
