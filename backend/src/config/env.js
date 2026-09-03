import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Strong validation of required secrets. Fails fast in production rather than
// running with an insecure/guessable secret.
function requireSecret(name, value) {
  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `[SECURITY] ${name} must be set to a random string of at least 32 characters in production. ` +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    // In development, allow the default but log a loud warning.
    console.warn(`[WARN] ${name} is not a strong secret. Set it in .env before deploying.`);
  }
  return value;
}

const parsePort = Number(process.env.PORT || 3000);
const parseTTL = Number(process.env.SESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number.isFinite(parsePort) ? parsePort : 3000,
  host: process.env.HOST || '0.0.0.0',

  // Session
  sessionSecret: requireSecret('SESSION_SECRET', process.env.SESSION_SECRET || 'dev-only-insecure-secret-not-for-production'),
  sessionTtlMs: Number.isFinite(parseTTL) ? parseTTL : 7 * 24 * 60 * 60 * 1000,
  cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',

  // Origins
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',

  // Rate limiting
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),

  // DB
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'bainovia.db'),
};

// Derive a distinct secret per feature from the master secret, so a leaked
// cookie secret isn't directly reusable elsewhere.
export function deriveSecret(feature) {
  return crypto.createHmac('sha256', env.sessionSecret).update('bainovia:' + feature).digest('hex');
}
