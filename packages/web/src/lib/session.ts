import { cookies } from 'next/headers';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface SessionUser {
  id: string;
  username: string;
  avatar: string | null;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

const COOKIE_NAME = 'mv_session';
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

const b64url = (buf: Buffer) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b64urlDecode = (s: string) =>
  Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

const getSecret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  return s;
};

const sign = (body: string) =>
  b64url(createHmac('sha256', getSecret()).update(body).digest());

const encode = (payload: SessionPayload) => {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
};

const decode = (token: string): SessionPayload | null => {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as SessionPayload;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export async function createSession(user: SessionUser) {
  const payload: SessionPayload = { ...user, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC };
  (await cookies()).set(COOKIE_NAME, encode(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SEC,
  });
}

export async function readSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = decode(token);
  if (!payload) return null;
  const { exp: _exp, ...user } = payload;
  return user;
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

// OAuth state (CSRF protection) — short-lived, cleared on callback
const STATE_COOKIE = 'mv_oauth_state';
const STATE_TTL_SEC = 5 * 60;

export async function issueOauthState() {
  const state = randomBytes(16).toString('hex');
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_TTL_SEC,
  });
  return state;
}

export async function consumeOauthState(received: string | null): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}
