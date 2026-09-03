import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';

// Ensure the data directory exists before opening the DB.
fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });

// Use Node's built-in SQLite (node:sqlite) - zero native dependencies,
// synchronous, and supports prepared statements (SQL injection safe).
const db = new DatabaseSync(env.dbPath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

// Migrations run at startup. Each entry is idempotent (CREATE IF NOT EXISTS).
const migrations = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS saves (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    hero_name    TEXT    NOT NULL,
    hero_level   INTEGER NOT NULL DEFAULT 1,
    hero_score   INTEGER NOT NULL DEFAULT 0,
    hero_class   TEXT    NOT NULL DEFAULT 'Werebear',
    save_data    TEXT    NOT NULL DEFAULT '{}',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_saves_score ON saves(hero_score DESC);
  `,
  // Server-side sessions keyed by a random token. The cookie only carries the
  // token; user data lives here, so logout/revocation works immediately.
  `
  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `,
];

// Run all migrations atomically.
db.exec('BEGIN;');
try {
  for (const stmt of migrations) db.exec(stmt);
  db.exec('COMMIT;');
} catch (err) {
  db.exec('ROLLBACK;');
  throw err;
}

export { db };
