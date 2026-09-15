import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Item, UserItem, categoryLabel } from '@moni/shared';
import { readSession } from '@/lib/session';
import { equipItem, unequipItem } from '@/lib/inventory';

const ERR_MSG: Record<string, string> = {
  bad_item: '잘못된 아이템 요청',
  not_found: '아이템을 찾을 수 없음',
};

interface InventoryProps {
  searchParams: Promise<{ err?: string }>;
}

export default async function Inventory({ searchParams }: InventoryProps) {
  const user = await readSession();
  if (!user) redirect('/');
  const { err } = await searchParams;

  const owned = await UserItem.findAll({
    where: { user_id: user.id },
    order: [['acquired_at', 'DESC']],
  });
  const items = owned.length
    ? await Item.findAll({ where: { id: owned.map((o) => o.item_id) } })
    : [];
  const byId = new Map(items.map((i) => [i.id, i]));

  const grouped = new Map<string, Array<{ userItem: UserItem; item: Item }>>();
  for (const u of owned) {
    const item = byId.get(u.item_id);
    if (!item) continue;
    const list = grouped.get(item.category) ?? [];
    list.push({ userItem: u, item });
    grouped.set(item.category, list);
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-8 gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-semibold">내 인벤토리</h1>
      {err && <p className="text-sm text-red-500">{ERR_MSG[err] ?? err}</p>}

      {owned.length === 0 ? (
        <p className="text-zinc-500">보유한 아이템이 없습니다.</p>
      ) : (
        <div className="w-full max-w-3xl flex flex-col gap-6">
          {[...grouped.entries()].map(([category, rows]) => (
            <section key={category} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
                {categoryLabel(category)}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {rows.map(({ userItem, item }) => {
                  const isSymbol = item.category === 'nickname_symbol';
                  const symbol = isSymbol
                    ? (item.payload as { symbol?: string } | undefined)?.symbol
                    : null;
                  return (
                    <li
                      key={userItem.id}
                      className="rounded border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-2 bg-white dark:bg-zinc-900"
                    >
                      <div className="flex justify-between items-baseline">
                        {isSymbol && symbol ? (
                          <span className="text-4xl">{symbol}</span>
                        ) : (
                          <span className="font-medium">{item.name}</span>
                        )}
                        {isSymbol && userItem.equipped && (
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            장착 중
                          </span>
                        )}
                      </div>
                      {isSymbol ? (
                        <form action={userItem.equipped ? unequipItem : equipItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            type="submit"
                            className={`w-full text-sm rounded px-3 py-1.5 ${
                              userItem.equipped
                                ? 'border border-zinc-300 dark:border-zinc-700'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            {userItem.equipped ? '해제' : '장착'}
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-zinc-500">보유 중 · 상시 이용 가능</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/shop" className="text-sm underline text-zinc-500">상점으로</Link>
        <Link href="/" className="text-sm underline text-zinc-500">홈으로</Link>
      </div>
    </main>
  );
}
