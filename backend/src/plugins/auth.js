import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import fp from 'fastify-plugin';
import { db } from '../db/database.js';
import { env } from '../config/env.js';
import { COOKIE_NAME, cookieBaseOptions } from '../config/cookies.js';

const BCRYPT_ROUNDS = 12;

/**
 * Auth plugin: bcrypt hashing + DB-backed session cookies.
 */
async function authPlugin(fastify, opts) {
  // bcrypt: never store plaintext passwords
  fastify.decorate('hashPassword', async (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS));
  fastify.decorate('verifyPassword', async (plain, hash) => {
    if (!plain || !hash) return false;
    try {
      return await bcrypt.compare(plain, hash);
    } catch {
      return false;
    }
  });

  // Create a server-side session for a user and set an httpOnly signed cookie.
  fastify.decorate('createSession', async (request, reply, { userId, username }) => {
    // Rotate: clear any existing session for this user on login.
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + env.sessionTtlMs;
    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);

    reply.setCookie(COOKIE_NAME, token, {
      ...cookieBaseOptions(),
      maxAge: Math.floor(env.sessionTtlMs / 1000),
    });
  });

  // Destroy the current session and clear the cookie.
  fastify.decorate('destroySession', async (request, reply) => {
    const token = request.cookies?.[COOKIE_NAME];
    if (token) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }
    reply.clearCookie(COOKIE_NAME, cookieBaseOptions());
  });

  // Resolve the current user from the session cookie, pruning expired sessions.
  fastify.decorate('loadUser', async (request) => {
    const token = request.cookies?.[COOKIE_NAME];
    if (!token) return null;

    const session = db
      .prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?')
      .get(token);
    if (!session) return null;

    if (session.expires_at < Date.now()) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return null;
    }

    const user = db
      .prepare('SELECT id, username FROM users WHERE id = ?')
      .get(session.user_id);
    return user || null;
  });

  // Guard: requires a valid session. Attaches `request.user`.
  const authenticate = async (request, reply) => {
    const user = await fastify.loadUser(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    request.user = user;
    return undefined;
  };
  fastify.decorate('authenticate', authenticate);
}

export default fp(authPlugin, { name: 'bainovia-auth' });
