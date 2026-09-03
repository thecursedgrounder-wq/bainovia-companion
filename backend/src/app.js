import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import securityPlugin from './plugins/security.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import saveRoutes from './routes/saves.js';
import leaderboardRoutes from './routes/leaderboard.js';

export async function buildApp(opts = {}) {
  const app = Fastify({ logger: opts.logger ?? true });

  await app.register(cookie);

  await app.register(cors, {
    origin: [env.frontendOrigin, 'http://localhost:5173'],
    credentials: true,
  });

  await app.register(securityPlugin);
  await app.register(authPlugin);

  await app.register(async (api) => {
    await api.register(authRoutes, { prefix: '/auth' });
    await api.register(saveRoutes, { prefix: '/saves' });
    await api.register(leaderboardRoutes, { prefix: '/leaderboard' });
  }, { prefix: '/api' });

  app.get('/api/health', async () => ({ status: 'ok', service: 'bainovia-companion' }));

  return app;
}
