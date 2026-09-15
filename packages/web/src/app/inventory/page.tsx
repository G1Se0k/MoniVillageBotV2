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
    include: [{ model: Item, required: true }],
    order: [['acquired_at', 'DESC']],
  });

  const grouped = new Map<string, Array<{ userItem: UserItem; item: Item }>>();
  for (const u of owned) {
    const item = u.Item;
    if (!item) continue;
    const list = grouped.get(item.category) ?? [];
    list.push({ userItem: u, item });
    grouped.set(item.category, list);
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-6 gap-6">
      <header className="w-full max-w-3xl flex flex-col items-center gap-2 pt-4">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
          Moni Village
        </p>
        <h1 className="text-3xl font-bold tracking-tight">내 인벤토리</h1>
      </header>

      {err && <p className="text-sm text-red-500">{ERR_MSG[err] ?? err}</p>}

      {owned.length === 0 ? (
        <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md px-8 py-10 text-center shadow-lg shadow-orange-500/5">
          <p className="text-zinc-500">보유한 아이템이 없습니다.</p>
          <Link
            href="/shop"
            className="inline-block mt-4 text-sm rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-1.5 shadow-md shadow-indigo-500/25"
          >
            상점 둘러보기 →
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-3xl flex flex-col gap-6">
          {[...grouped.entries()].map(([category, rows]) => (
            <section key={category} className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                {categoryLabel(category)}
              </h2>
              <ul
                className={`grid gap-3 ${
                  category === 'nickname_symbol'
                    ? 'grid-cols-2 sm:grid-cols-4'
                    : 'sm:grid-cols-2'
                }`}
              >
                {rows.map(({ userItem, item }) => {
                  const isSymbol = item.category === 'nickname_symbol';
                  const symbol = isSymbol
                    ? (item.payload as { symbol?: string } | undefined)?.symbol
                    : null;
                  return (
                    <li
                      key={userItem.id}
                      className={`relative rounded-2xl border p-4 flex flex-col gap-2 backdrop-blur-md shadow-lg transition hover:-translate-y-0.5 ${
                        userItem.equipped
                          ? 'border-amber-400/60 dark:border-orange-500/40 bg-amber-50/70 dark:bg-orange-950/40 shadow-orange-500/20'
                          : 'border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 shadow-orange-500/5 hover:shadow-orange-500/10'
                      }`}
                    >
                      <div className="flex justify-between items-baseline">
                        {isSymbol && symbol ? (
                          <span className="text-4xl">{symbol}</span>
                        ) : (
                          <span className="font-semibold">{item.name}</span>
                        )}
                        {isSymbol && userItem.equipped && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
                            장착 중
                          </span>
                        )}
                      </div>
                      {isSymbol ? (
                        <form action={userItem.equipped ? unequipItem : equipItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            type="submit"
                            className={`w-full text-sm rounded-full px-3 py-1.5 transition ${
                              userItem.equipped
                                ? 'border border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 hover:border-amber-400'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25'
                            }`}
                          >
                            {userItem.equipped ? '해제' : '장착'}
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          보유 중 · 상시 이용 가능
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="flex gap-4 text-sm text-zinc-500">
        <Link href="/shop" className="hover:text-orange-500 transition">
          상점으로
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <Link href="/" className="hover:text-orange-500 transition">
          홈으로
        </Link>
      </div>
    </main>
  );
}
