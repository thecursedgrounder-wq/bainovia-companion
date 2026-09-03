import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Extract the session cookie value from a set-cookie header (string or array).
function sessionCookie(res) {
  const sc = res.headers['set-cookie'];
  const line = Array.isArray(sc) ? sc.find((c) => c.startsWith('bainovia_session=')) : String(sc);
  return line.split(';').find((c) => c.startsWith('bainovia_session='));
}

// Use a throwaway DB for tests so we don't touch dev data.
process.env.DB_PATH = path.join(__dirname, '..', 'data', 'test-bainovia.db');

describe('Bainovia Companion API', () => {
  let app;
  const base = '/api';

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
    // Clean slate regardless of any stale WAL/db state from prior runs.
    const { db } = await import('../src/db/database.js');
    db.exec('DELETE FROM saves; DELETE FROM sessions; DELETE FROM users;');
  });

  afterAll(async () => {
    await app.close();
    // Clean up test db
    try {
      fs.rmSync(path.join(__dirname, '..', 'data', 'test-bainovia.db'), { force: true });
    } catch {}
  });

  it('reports health', async () => {
    const res = await app.inject({ method: 'GET', url: `${base}/health` });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });

  it('registers a user and sets a session cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${base}/auth/register`,
      payload: { username: 'hero1', email: 'hero1@bainovia.test', password: 'Password1' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().username).toBe('hero1');
    expect(res.headers['set-cookie']).toBeTruthy();
  });

  it('rejects a weak password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${base}/auth/register`,
      payload: { username: 'hero2', email: 'hero2@bainovia.test', password: 'password' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects login with wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${base}/auth/login`,
      payload: { username: 'hero1', password: 'Wrongpass1' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('logs in and can access /me', async () => {
    const login = await app.inject({
      method: 'POST',
      url: `${base}/auth/login`,
      payload: { username: 'hero1', password: 'Password1' },
    });
    expect(login.statusCode).toBe(200);
    const cookie = sessionCookie(login);

    const me = await app.inject({
      method: 'GET',
      url: `${base}/auth/me`,
      headers: { cookie },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().username).toBe('hero1');
  });

  it('blocks unauthenticated /saves', async () => {
    const res = await app.inject({ method: 'GET', url: `${base}/saves` });
    expect(res.statusCode).toBe(401);
  });

  it('uploads a save and appears on the leaderboard', async () => {
    const login = await app.inject({
      method: 'POST',
      url: `${base}/auth/login`,
      payload: { username: 'hero1', password: 'Password1' },
    });
    const cookie = sessionCookie(login);

    const save = await app.inject({
      method: 'POST',
      url: `${base}/saves`,
      headers: { cookie },
      payload: { heroName: 'Greyvein', heroLevel: 12, heroScore: 3400, heroClass: 'Werebear', saveData: '{"level":12}' },
    });
    expect(save.statusCode).toBe(201);

    const lb = await app.inject({ method: 'GET', url: `${base}/leaderboard` });
    expect(lb.statusCode).toBe(200);
    expect(lb.json()[0].heroName).toBe('Greyvein');
  });

  it('refuses to access another user context via /me after logout', async () => {
    const login = await app.inject({
      method: 'POST',
      url: `${base}/auth/login`,
      payload: { username: 'hero1', password: 'Password1' },
    });
    const cookie = sessionCookie(login);

    const logout = await app.inject({
      method: 'POST',
      url: `${base}/auth/logout`,
      headers: { cookie },
    });
    expect(logout.statusCode).toBe(200);

    const me = await app.inject({
      method: 'GET',
      url: `${base}/auth/me`,
      headers: { cookie },
    });
    expect(me.statusCode).toBe(401);
  });
});
