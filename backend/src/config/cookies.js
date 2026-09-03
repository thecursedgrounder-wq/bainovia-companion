import { env } from './env.js';

// httpOnly prevents XSS from reading the session cookie via JS.
// SameSite=Lax mitigates CSRF for cross-site POSTs while keeping simple UX.
// Secure ensures the cookie is only sent over HTTPS (enforced in production).
export const COOKIE_NAME = 'bainovia_session';

export function cookieBaseOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    path: '/',
  };
}
