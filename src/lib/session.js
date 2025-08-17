import { cookies } from 'next/headers';
import crypto from 'node:crypto';

const COOKIE_NAME = 'ps_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
}

function sign(payload) {
  const secret = getSecret();
  const h = crypto.createHmac('sha256', secret);
  h.update(payload);
  return h.digest('hex');
}

export function createSessionToken(data) {
  const exp = Date.now() + SESSION_TTL_MS;
  const body = JSON.stringify({ ...data, exp });
  const b64 = Buffer.from(body).toString('base64url');
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  const expected = sign(b64);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const json = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (typeof json.exp !== 'number' || json.exp < Date.now()) return null;
    return json;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const data = verifySessionToken(token);
  if (!data) return null;
  const { exp, ...user } = data;
  return user;
}

export async function setSession(user) {
  const cookieStore = await cookies();
  const token = createSessionToken(user);
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  // Clear the session cookie by setting it to expire immediately
  cookieStore.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0, // Expire immediately
    expires: new Date(0), // Also set explicit expiry
  });
}

