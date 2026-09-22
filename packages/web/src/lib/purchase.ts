'use server';

import { redirect } from 'next/navigation';
import { Item, UserItem, UserWallet, sequelize } from '@moni/shared';
import { readSession } from './session';
import { isGuest } from './guest';

export async function purchaseItem(formData: FormData) {
  const user = await readSession();
  if (!user) redirect('/');
  if (await isGuest()) redirect('/shop');

  const itemId = Number(formData.get('itemId'));
  if (!Number.isFinite(itemId)) redirect('/shop?err=bad_item');

  const item = await Item.findByPk(itemId);
  if (!item || !item.active) redirect('/shop?err=unavailable');

  let insufficient: boolean = false;

  try {
    await sequelize.transaction(async (t) => {
      const [wallet] = await UserWallet.findOrCreate({
        where: { user_id: user.id },
        defaults: { user_id: user.id, balance: 0 },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const [, created] = await UserItem.findOrCreate({
        where: { user_id: user.id, item_id: item.id },
        defaults: { user_id: user.id, item_id: item.id, equipped: false },
        transaction: t,
      });
      if (!created) return; // 이미 보유 — 코인 차감 없이 성공 처리

      if (wallet.balance < item.price) {
        insufficient = true;
        throw new Error('rollback'); // 트랜잭션 롤백 (UserItem 삽입 취소)
      }

      wallet.balance -= item.price;
      await wallet.save({ transaction: t });
    });
  } catch (e) {
    if (!insufficient) throw e;
  }

  if (insufficient) redirect(`/shop/checkout/${item.id}?err=insufficient`);
  redirect(`/shop/success/${item.id}`);
}
