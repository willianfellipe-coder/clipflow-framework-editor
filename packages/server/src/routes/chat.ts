import type { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { chatMessages, projects } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { broadcast } from '../plugins/websocket.js';
import { AppError } from '../utils/errors.js';

export async function chatRoutes(app: FastifyInstance) {
  // List chat messages for a project
  app.get<{ Params: { id: string } }>('/api/projects/:id/chat', async (request) => {
    const rows = db.select().from(chatMessages)
      .where(eq(chatMessages.projectId, request.params.id))
      .orderBy(chatMessages.createdAt)
      .all();
    return rows;
  });

  // Send a chat message (from user UI or from MCP assistant)
  app.post<{
    Params: { id: string };
    Body: { role: 'user' | 'assistant'; content: string };
  }>('/api/projects/:id/chat', async (request, reply) => {
    const project = db.select().from(projects)
      .where(eq(projects.id, request.params.id))
      .get();
    if (!project) throw new AppError(404, 'Project not found', 'NOT_FOUND');

    const { role, content } = request.body;
    if (!role || !content) throw new AppError(400, 'role and content are required', 'VALIDATION');

    const id = nanoid();
    const now = new Date();

    db.insert(chatMessages).values({
      id,
      projectId: project.id,
      role,
      content,
      createdAt: now,
    }).run();

    const message = { id, projectId: project.id, role, content, createdAt: now };
    broadcast('chat:message', message);

    return reply.status(201).send(message);
  });

  // Get pending user messages (for MCP polling — unread by assistant)
  app.get<{ Params: { id: string } }>('/api/projects/:id/chat/pending', async (request) => {
    const rows = db.select().from(chatMessages)
      .where(eq(chatMessages.projectId, request.params.id))
      .orderBy(desc(chatMessages.createdAt))
      .all();

    // Find messages after the last assistant message
    const lastAssistantIdx = rows.findIndex((m) => m.role === 'assistant');
    const pending = lastAssistantIdx === -1 ? rows : rows.slice(0, lastAssistantIdx);
    return pending.reverse();
  });
}
