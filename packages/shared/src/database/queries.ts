import { Item } from './models/Item';
import { UserItem } from './models/UserItem';
import { sequelize } from './sequelize';

/** balance += amount 를 지갑 upsert와 한 쿼리로 원자 처리 (MySQL). */
export async function creditCoin(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  await sequelize.query(
    'INSERT INTO user_wallets (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?',
    { replacements: [userId, amount, amount] },
  );
}

export async function getEquippedSymbol(userId: string): Promise<string | null> {
  const owned = await UserItem.findOne({
    where: { user_id: userId, equipped: true },
    include: [{ model: Item, where: { category: 'nickname_symbol' }, required: true }],
  });
  const payload = owned?.Item?.payload as { symbol?: string } | undefined;
  return payload?.symbol ?? null;
}
