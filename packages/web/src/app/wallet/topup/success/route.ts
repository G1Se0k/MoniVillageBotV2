import { NextRequest, NextResponse } from 'next/server';
import { UserWallet, sequelize } from '@moni/shared';
import { readSession } from '@/lib/session';
import { packagePrice } from '@/lib/wallet';
import { confirmTossPayment } from '@/lib/toss';

export async function GET(req: NextRequest) {
  const user = await readSession();
  if (!user) return NextResponse.redirect(new URL('/', req.url));

  const sp = req.nextUrl.searchParams;
  const paymentKey = sp.get('paymentKey');
  const orderId = sp.get('orderId');
  const amountStr = sp.get('amount');
  if (!paymentKey || !orderId || !amountStr) {
    return NextResponse.redirect(new URL('/wallet?err=missing_params', req.url));
  }
  const amount = Number(amountStr);

  const m = orderId.match(/^topup-(\d+)-/);
  if (!m) return NextResponse.redirect(new URL('/wallet?err=bad_order', req.url));
  const coins = Number(m[1]);
  const expected = packagePrice(coins);
  if (!expected || expected !== amount) {
    return NextResponse.redirect(new URL('/wallet?err=amount_mismatch', req.url));
  }

  try {
    await confirmTossPayment(paymentKey, orderId, amount);
  } catch (e) {
    const code = e instanceof Error ? e.message : 'CONFIRM_FAILED';
    return NextResponse.redirect(
      new URL(`/wallet?err=${encodeURIComponent(code)}`, req.url),
    );
  }

  await sequelize.transaction(async (t) => {
    const [wallet] = await UserWallet.findOrCreate({
      where: { user_id: user.id },
      defaults: { user_id: user.id, balance: 0 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    wallet.balance += coins;
    await wallet.save({ transaction: t });
  });

  return NextResponse.redirect(new URL('/wallet?ok=1', req.url));
}
