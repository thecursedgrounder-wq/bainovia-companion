import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config/env.js';

/**
 * Security plugin:
 *  - helmet: sane security headers (CSP, X-Frame-Options, HSTS, etc.)
 *  - rate limit: global request throttle to blunt brute-force / DoS
 */
async function securityPlugin(fastify, opts) {
  await fastify.register(helmet, {
    // Allow the frontend's own scripts/styles (dev uses Vite with inline dev bits).
    contentSecurityPolicy: env.isProduction ? undefined : false,
  });

  await fastify.register(rateLimit, {
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindowMs,
    // Standard identifier from a fastify context; uses IP by default.
  });
}

export default fp(securityPlugin, { name: 'bainovia-security' });
