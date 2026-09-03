# Bainovia Companion

A full-stack web companion for the **Bainovia** game (a werebear action-RPG). Players sign in, upload their in-game save data, and see their hero's stats and standing on a global leaderboard.

Built as a demonstrable full-stack app with security in mind throughout.

## Tech Stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Backend  | Node.js + **Fastify**                               |
| Frontend | **Vite + React**                                    |
| Database | **SQLite** (via `better-sqlite3`)                   |
| Auth     | **Session-based** with bcrypt password hashing + httpOnly cookies |
| Security | Helmet, rate limiting, input validation (zod), parameterized SQL, secure cookie flags, secrets via `.env` |

## Features

- **Authentication** — register, login, logout with session cookies (httpOnly, `SameSite=Lax`, Secure in production), bcrypt-hashed passwords, constant-time comparison.
- **Save management** — upload, update, list, and delete the player's save-game JSON.
- **Leaderboard** — global ranking by hero level / score.
- **Security hardening** — validated & rate-limited Auth routes are protected; database queries are parameterized (SQL injection safe); security headers set; secrets never committed.

## Security Notes

- Passwords are **never** stored in plaintext — only bcrypt hashes.
- Session cookies are `httpOnly` (not readable by JS) and `SameSite=Lax`.
- All SQL uses prepared statements to prevent SQL injection.
- Secrets live in `.env` (git-ignored). `SESSION_SECRET` must be a strong random value.
- Zod schemas validate every request body before it reaches a handler.

## Repository Layout

```
bainovia-companion/
  backend/            # Fastify API
    src/
      app.js          # Fastify app composition
      server.js       # Entry point
      config/env.js   # Environment config (loads .env)
      db/
        database.js   # SQLite connection + schema
      plugins/        # auth, security, db plugins
      routes/         # auth.js, saves.js, leaderboard.js
  frontend/           # Vite + React app
    src/
      api.js          # API client (sends credentials)
      App.jsx
      pages/          # Login, Register, Dashboard
  docker-compose.yml  # One-command local startup
```

## Getting Started

### Prerequisites

- Node.js 20+ (tested on 24)
- npm

### 1. Backend

```bash
cd backend
cp ../.env.example ../.env   # then edit .env: set a strong SESSION_SECRET
npm install
npm run dev
```

The API runs at `http://localhost:3000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` (Vite dev server proxies `/api` to the backend).

### 3. Docker (optional, one-command)

```bash
docker-compose up --build
```

## API

| Method | Path                | Auth | Description                     |
| ------ | ------------------- | ---- | ------------------------------- |
| POST   | `/api/auth/register`|  No  | Create an account               |
| POST   | `/api/auth/login`   |  No  | Log in (sets session cookie)    |
| POST   | `/api/auth/logout`  | Yes  | Log out / clear session         |
| GET    | `/api/auth/me`      | Yes  | Current user info               |
| GET    | `/api/saves`        | Yes  | List my saves                   |
| POST   | `/api/saves`        | Yes  | Upload / update a save          |
| DELETE | `/api/saves/:id`    | Yes  | Delete one of my saves          |
| GET    | `/api/leaderboard`  | No   | Global leaderboard              |

## Scripts

Backend:
- `npm run dev` — start with auto-reload (node --watch)
- `npm start` — start (production)
- `npm test` — run API smoke/unit tests

Frontend:
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — serve the build

## License

Private / for your own use unless you change it.
