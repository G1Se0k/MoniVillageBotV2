import { Item } from './models/Item';
import { UserItem } from './models/UserItem';
import { UserWallet } from './models/UserWallet';

/** 지갑을 생성-확인 후 balance에 amount를 원자적으로 더함. */
export async function creditCoin(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  await UserWallet.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId, balance: 0 },
  });
  await UserWallet.increment({ balance: amount }, { where: { user_id: userId } });
}

export async function getEquippedSymbol(userId: string): Promise<string | null> {
  const owned = await UserItem.findAll({ where: { user_id: userId, equipped: true } });
  if (owned.length === 0) return null;
  const items = await Item.findAll({ where: { id: owned.map((o) => o.item_id) } });
  const symbolItem = items.find((i) => i.category === 'nickname_symbol');
  const payload = symbolItem?.payload as { symbol?: string } | undefined;
  return payload?.symbol ?? null;
}
