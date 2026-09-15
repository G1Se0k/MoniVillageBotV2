'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Item, UserItem } from '@moni/shared';
import { readSession } from './session';
import { applySymbolToNickname } from './discordNickname';

const parseItemId = (formData: FormData) => {
  const id = Number(formData.get('itemId'));
  return Number.isFinite(id) ? id : null;
};

export async function equipItem(formData: FormData) {
  const user = await readSession();
  if (!user) redirect('/');

  const itemId = parseItemId(formData);
  if (itemId === null) redirect('/inventory?err=bad_item');

  const target = await Item.findByPk(itemId);
  if (!target) redirect('/inventory?err=not_found');

  // ponytail: 카테고리당 1개 장착 제약을 앱 레벨에서 처리 — 같은 카테고리 다른 아이템 언장착
  const siblingItemIds = (
    await Item.findAll({ where: { category: target.category }, attributes: ['id'] })
  ).map((i) => i.id);

  await UserItem.update(
    { equipped: false },
    { where: { user_id: user.id, item_id: siblingItemIds } },
  );
  await UserItem.update(
    { equipped: true },
    { where: { user_id: user.id, item_id: itemId } },
  );

  if (target.category === 'nickname_symbol') {
    const symbol = (target.payload as { symbol?: string } | undefined)?.symbol ?? null;
    await applySymbolToNickname(user.id, symbol);
  }

  revalidatePath('/inventory');
  redirect('/inventory');
}

export async function unequipItem(formData: FormData) {
  const user = await readSession();
  if (!user) redirect('/');

  const itemId = parseItemId(formData);
  if (itemId === null) redirect('/inventory?err=bad_item');

  const target = await Item.findByPk(itemId);

  await UserItem.update(
    { equipped: false },
    { where: { user_id: user.id, item_id: itemId } },
  );

  if (target?.category === 'nickname_symbol') {
    await applySymbolToNickname(user.id, null);
  }

  revalidatePath('/inventory');
  redirect('/inventory');
}
