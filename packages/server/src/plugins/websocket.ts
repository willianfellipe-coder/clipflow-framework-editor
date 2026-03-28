import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import type { WebSocket } from 'ws';

const clients = new Set<WebSocket>();

export async function registerWebSocket(app: FastifyInstance) {
  await app.register(websocket);

  app.get('/ws', { websocket: true }, (socket) => {
    clients.add(socket);
    socket.send(JSON.stringify({ event: 'connected', data: { version: '0.1.0' } }));

    socket.on('close', () => {
      clients.delete(socket);
    });
  });
}

export function broadcast(event: string, data: unknown) {
  const message = JSON.stringify({ event, data });
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}
