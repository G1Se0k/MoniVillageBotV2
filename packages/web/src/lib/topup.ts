'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { UserWallet, sequelize } from '@moni/shared';
import { readSession } from './session';
import { isValidPackage } from './wallet';

export async function topupWallet(formData: FormData) {
  const user = await readSession();
  if (!user) redirect('/');

  const coins = Number(formData.get('coins'));
  if (!Number.isFinite(coins) || !isValidPackage(coins)) {
    redirect('/wallet?err=bad_package');
  }

  // ponytail: 테스트 결제 — 게이트웨이 호출 없이 잔액만 증가
  await sequelize.transaction(async (t) => {
    const [wallet] = await UserWallet.findOrCreate({
      where: { user_id: user.id },
      defaults: { user_id: user.id, balance: 0 },
      transaction: t,
    });
    wallet.balance += coins;
    await wallet.save({ transaction: t });
  });

  revalidatePath('/wallet');
  redirect('/wallet?ok=1');
}
