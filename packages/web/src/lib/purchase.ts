'use server';

import { redirect } from 'next/navigation';
import { Item, UserItem } from '@moni/shared';
import { readSession } from './session';

export async function purchaseItem(formData: FormData) {
  const user = await readSession();
  if (!user) redirect('/');

  const itemId = Number(formData.get('itemId'));
  if (!Number.isFinite(itemId)) redirect('/shop?err=bad_item');

  const item = await Item.findByPk(itemId);
  if (!item || !item.active) redirect('/shop?err=unavailable');

  // ponytail: 테스트 결제 — 게이트웨이 호출 없음, DB만 기록
  await UserItem.findOrCreate({
    where: { user_id: user.id, item_id: item.id },
    defaults: { user_id: user.id, item_id: item.id, equipped: false },
  });

  redirect(`/shop/success/${item.id}`);
}
