import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';
import { clearGuestCookie } from '@/lib/guest';
import { getAppOrigin } from '@/lib/appUrl';

export async function POST() {
  await clearSession();
  await clearGuestCookie();
  return NextResponse.redirect(new URL('/', getAppOrigin()), { status: 303 });
}
