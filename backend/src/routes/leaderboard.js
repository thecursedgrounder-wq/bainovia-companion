import { db } from '../db/database.js';

export default async function leaderboardRoutes(fastify, opts) {
  // Public leaderboard: top heroes by score.
  fastify.get('/', async (request, reply) => {
    const rows = db
      .prepare(`
        SELECT s.hero_name AS heroName, s.hero_level AS heroLevel, s.hero_score AS heroScore,
               s.hero_class AS heroClass, u.username, s.updated_at AS updatedAt
        FROM saves s
        JOIN users u ON u.id = s.user_id
        ORDER BY s.hero_score DESC
        LIMIT 100
      `)
      .all();
    return reply.send(rows);
  });
}
