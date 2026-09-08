import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachMultiplayer } from '../server/multiplayer.mjs';
import { createStaticHandler } from '../server/http-handler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
const trustProxy = process.env.TRUST_PROXY === 'true';
const server = http.createServer({ maxHeaderSize:16_384, requestTimeout:15_000, headersTimeout:10_000, keepAliveTimeout:5_000 }, createStaticHandler(dist, { production:true, trustProxy, requestsPerMinute:Number(process.env.HTTP_RATE_LIMIT || 300) }));
server.maxRequestsPerSocket = 1000;
attachMultiplayer(server, {
  allowedOrigins:process.env.ALLOWED_ORIGINS || '', allowMissingOrigin:false, trustProxy,
  maxConnections:Number(process.env.WS_MAX_CONNECTIONS || 1000),
  maxConnectionsPerIp:Number(process.env.WS_MAX_CONNECTIONS_PER_IP || 20),
  maxRooms:Number(process.env.WS_MAX_ROOMS || 500),
  maxSessions:Number(process.env.WS_MAX_SESSIONS || 5000),
  maxPayloadBytes:Number(process.env.WS_MAX_PAYLOAD_BYTES || 4096),
});

const sockets = new Set();
server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
const shutdown = signal => {
  console.log(`${signal}: encerrando servidor...`);
  server.close(() => process.exit(0));
  setTimeout(() => { for (const socket of sockets) socket.destroy(); process.exit(1); }, 10_000).unref();
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
server.listen(port, '0.0.0.0', () => console.log(`Cielo Fantasy Fight production server on 0.0.0.0:${port}`));
