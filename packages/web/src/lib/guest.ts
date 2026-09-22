import { cookies } from 'next/headers';

export const GUEST_COOKIE = 'mv_guest';
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

export async function isGuest() {
  return (await cookies()).get(GUEST_COOKIE)?.value === '1';
}

export async function setGuestCookie() {
  (await cookies()).set(GUEST_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearGuestCookie() {
  (await cookies()).delete(GUEST_COOKIE);
}
