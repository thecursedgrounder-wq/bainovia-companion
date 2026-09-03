import { z } from 'zod';
import { db } from '../db/database.js';

const saveSchema = z.object({
  heroName: z.string().min(1).max(64),
  heroLevel: z.number().int().min(1).max(9999).default(1),
  heroScore: z.number().int().min(0).max(2_147_483_647).default(0),
  heroClass: z.string().max(64).default('Werebear'),
  saveData: z.string().max(200_000).default('{}'), // arbitrary JSON, size-capped
});

export default async function saveRoutes(fastify, opts) {
  // List my saves
  fastify.get('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const rows = db
      .prepare('SELECT id, hero_name, hero_level, hero_score, hero_class, updated_at FROM saves WHERE user_id = ? ORDER BY updated_at DESC')
      .all(request.user.id);
    return reply.send(rows);
  });

  // Upload / update a primary save (upsert per user: one active save per user)
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const parsed = saveSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }
    const { heroName, heroLevel, heroScore, heroClass, saveData } = parsed.data;
    const userId = request.user.id;

    const existing = db.prepare('SELECT id FROM saves WHERE user_id = ?').get(userId);

    if (existing) {
      db.prepare(`
        UPDATE saves SET
          hero_name = ?, hero_level = ?, hero_score = ?, hero_class = ?, save_data = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(heroName, heroLevel, heroScore, heroClass, saveData, existing.id);
      return reply.send({ id: existing.id, heroName, heroLevel, heroScore });
    }

    const info = db
      .prepare('INSERT INTO saves (user_id, hero_name, hero_level, hero_score, hero_class, save_data) VALUES (?,?,?,?,?,?)')
      .run(userId, heroName, heroLevel, heroScore, heroClass, saveData);
    return reply.code(201).send({ id: Number(info.lastInsertRowid), heroName, heroLevel, heroScore });
  });

  // Delete one of MY saves (ownership enforced)
  fastify.delete('/:id', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return reply.code(400).send({ error: 'Invalid id' });
    }
    const result = db
      .prepare('DELETE FROM saves WHERE id = ? AND user_id = ?')
      .run(id, request.user.id);
    if (result.changes === 0) {
      return reply.code(404).send({ error: 'Save not found' });
    }
    return reply.send({ success: true });
  });
}
