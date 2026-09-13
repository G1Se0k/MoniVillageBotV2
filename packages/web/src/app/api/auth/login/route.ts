import { NextResponse } from 'next/server';
import { buildAuthorizeUrl } from '@/lib/discord';
import { issueOauthState } from '@/lib/session';

export async function GET() {
  const state = await issueOauthState();
  return NextResponse.redirect(buildAuthorizeUrl(state));
}
