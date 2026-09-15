import { Item } from './models/Item';
import { UserItem } from './models/UserItem';

export async function getEquippedSymbol(userId: string): Promise<string | null> {
  const owned = await UserItem.findAll({ where: { user_id: userId, equipped: true } });
  if (owned.length === 0) return null;
  const items = await Item.findAll({ where: { id: owned.map((o) => o.item_id) } });
  const symbolItem = items.find((i) => i.category === 'nickname_symbol');
  const payload = symbolItem?.payload as { symbol?: string } | undefined;
  return payload?.symbol ?? null;
}
