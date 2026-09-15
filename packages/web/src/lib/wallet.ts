import { UserWallet } from '@moni/shared';

export async function getBalance(userId: string): Promise<number> {
  const [wallet] = await UserWallet.findOrCreate({
    where: { user_id: userId },
    defaults: { user_id: userId, balance: 0 },
  });
  return wallet.balance;
}

// 코인 패키지 (mock 결제 — 1코인 = 10원)
export const COIN_PACKAGES = [
  { coins: 100, price: 1000 },
  { coins: 500, price: 5000 },
  { coins: 1000, price: 10000 },
] as const;

export const isValidPackage = (coins: number) =>
  COIN_PACKAGES.some((p) => p.coins === coins);

export const packagePrice = (coins: number) =>
  COIN_PACKAGES.find((p) => p.coins === coins)?.price;
