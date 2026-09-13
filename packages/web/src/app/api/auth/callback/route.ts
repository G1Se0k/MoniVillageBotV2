import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForUser } from '@/lib/discord';
import { consumeOauthState, createSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?login_error=${encodeURIComponent(error)}`, origin));
  }
  if (!code || !(await consumeOauthState(state))) {
    return NextResponse.redirect(new URL('/?login_error=invalid_state', origin));
  }

  try {
    const user = await exchangeCodeForUser(code);
    await createSession(user);
    return NextResponse.redirect(new URL('/', origin));
  } catch (e) {
    console.error('OAuth callback failed:', e);
    return NextResponse.redirect(new URL('/?login_error=exchange_failed', origin));
  }
}
