import { z } from 'zod';
import { db } from '../db/database.js';

const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, 'username may only contain letters, numbers, and underscores'),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[a-zA-Z]/, 'password must contain a letter')
    .regex(/[0-9]/, 'password must contain a number'),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// A dummy bcrypt hash to equalize login timing for nonexistent users,
// mitigating username enumeration via response timing.
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.ENY1nZtI0kGvE0vU0n0h3dH5eF0a7Wq';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export default async function authRoutes(fastify, opts) {
  // Register
  fastify.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }
    const { username, email, password } = parsed.data;
    const normalizedEmail = normalizeEmail(email);

    const existing = db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, normalizedEmail);
    if (existing) {
      return reply.code(409).send({ error: 'Username or email already in use' });
    }

    const passwordHash = await fastify.hashPassword(password);
    const info = db
      .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
      .run(username, normalizedEmail, passwordHash);

    await fastify.createSession(request, reply, {
      userId: Number(info.lastInsertRowid),
      username,
    });

    return reply.code(201).send({ id: Number(info.lastInsertRowid), username });
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }
    const { username, password } = parsed.data;

    const user = db
      .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
      .get(username);

    // Always run a bcrypt compare (real or dummy) to normalize timing.
    const ok = user
      ? await fastify.verifyPassword(password, user.password_hash)
      : await fastify.verifyPassword(password, DUMMY_HASH);

    if (!user || !ok) {
      return reply.code(401).send({ error: 'Invalid username or password' });
    }

    await fastify.createSession(request, reply, {
      userId: user.id,
      username: user.username,
    });

    return reply.send({ id: user.id, username: user.username });
  });

  // Logout
  fastify.post('/logout', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    await fastify.destroySession(request, reply);
    return reply.send({ success: true });
  });

  // Current user
  fastify.get('/me', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    return reply.send(request.user);
  });
}
