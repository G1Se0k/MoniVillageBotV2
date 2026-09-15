import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';
import { getAppOrigin } from '@/lib/appUrl';

export async function POST() {
  await clearSession();
  return NextResponse.redirect(new URL('/', getAppOrigin()), { status: 303 });
}
