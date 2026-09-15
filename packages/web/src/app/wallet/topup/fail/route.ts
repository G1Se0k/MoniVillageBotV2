import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || 'PAY_FAILED';
  return NextResponse.redirect(
    new URL(`/wallet?err=${encodeURIComponent(code)}`, req.url),
  );
}
