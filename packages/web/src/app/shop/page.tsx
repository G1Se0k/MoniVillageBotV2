import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Item, UserItem } from '@moni/shared';
import { readSession } from '@/lib/session';
import { getBalance } from '@/lib/wallet';

const ERR_MSG: Record<string, string> = {
  bad_item: '잘못된 아이템 요청',
  unavailable: '판매 중이 아닌 아이템',
};

interface ShopProps {
  searchParams: Promise<{ err?: string }>;
}

export default async function Shop({ searchParams }: ShopProps) {
  const user = await readSession();
  if (!user) redirect('/');
  const { err } = await searchParams;

  const [items, owned, balance] = await Promise.all([
    Item.findAll({ where: { active: true }, order: [['id', 'ASC']] }),
    UserItem.findAll({ where: { user_id: user.id }, attributes: ['item_id'] }),
    getBalance(user.id),
  ]);
  const ownedIds = new Set(owned.map((o) => o.item_id));

  return (
    <main className="min-h-screen flex flex-col items-center p-8 gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-semibold">채팅 꾸미기 샵</h1>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-zinc-500">보유 코인</span>
        <span className="font-semibold">{balance.toLocaleString()}</span>
        <Link href="/wallet" className="underline text-indigo-600 dark:text-indigo-400">
          충전
        </Link>
      </div>

      {err && <p className="text-sm text-red-500">{ERR_MSG[err] ?? err}</p>}

      {items.length === 0 ? (
        <p className="text-zinc-500">등록된 아이템이 없습니다.</p>
      ) : (
        <ul className="w-full max-w-2xl grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const isOwned = ownedIds.has(item.id);
            const affordable = balance >= item.price;
            return (
              <li
                key={item.id}
                className="rounded border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-2 bg-white dark:bg-zinc-900"
              >
                <div className="flex justify-between items-baseline">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-zinc-500">{item.category}</span>
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {item.price.toLocaleString()} 코인
                </span>
                {isOwned ? (
                  <span className="text-sm text-zinc-400">보유 중</span>
                ) : affordable ? (
                  <Link
                    href={`/shop/checkout/${item.id}`}
                    className="text-sm text-center rounded bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5"
                  >
                    구매하기
                  </Link>
                ) : (
                  <span className="text-sm text-center text-red-500">코인 부족</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/" className="text-sm underline text-zinc-500">← 홈으로</Link>
    </main>
  );
}
