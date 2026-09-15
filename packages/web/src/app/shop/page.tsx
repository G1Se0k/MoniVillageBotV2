import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Item, UserItem, categoryLabel } from '@moni/shared';
import { readSession } from '@/lib/session';
import { isGuildAdmin } from '@/lib/admin';
import { getBalance } from '@/lib/wallet';

const ERR_MSG: Record<string, string> = {
  bad_item: '잘못된 아이템 요청',
  unavailable: '판매 중이 아닌 아이템',
};

interface ShopProps {
  searchParams: Promise<{ err?: string; hideOwned?: string; cat?: string }>;
}

export default async function Shop({ searchParams }: ShopProps) {
  const user = await readSession();
  if (!user) redirect('/');
  const { err, hideOwned: hideOwnedParam, cat: catParam } = await searchParams;
  const hideOwned = hideOwnedParam === '1';
  const activeCat = catParam && catParam !== 'all' ? catParam : 'all';

  const [items, owned, balance, admin] = await Promise.all([
    Item.findAll({ where: { active: true }, order: [['category', 'ASC'], ['id', 'ASC']] }),
    UserItem.findAll({ where: { user_id: user.id }, attributes: ['item_id'] }),
    getBalance(user.id),
    isGuildAdmin(user.id),
  ]);
  const ownedIds = new Set(owned.map((o) => o.item_id));

  const allCategories: string[] = [];
  for (const i of items) if (!allCategories.includes(i.category)) allCategories.push(i.category);

  const visibleItems = items.filter(
    (i) => (activeCat === 'all' || i.category === activeCat) && (!hideOwned || !ownedIds.has(i.id)),
  );

  const grouped = new Map<string, Item[]>();
  for (const item of visibleItems) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  const buildHref = (next: { cat?: string; hideOwned?: boolean }) => {
    const cat = next.cat ?? activeCat;
    const owned = next.hideOwned ?? hideOwned;
    const p = new URLSearchParams();
    if (cat !== 'all') p.set('cat', cat);
    if (owned) p.set('hideOwned', '1');
    const qs = p.toString();
    return qs ? `/shop?${qs}` : '/shop';
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-6 gap-6">
      <header className="w-full max-w-3xl flex flex-col items-center gap-2 pt-4">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
          Moni Village
        </p>
        <h1 className="text-3xl font-bold tracking-tight">채팅 꾸미기 샵</h1>
      </header>

      <div className="flex items-center gap-3 rounded-full border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md px-4 py-2 shadow-sm">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">보유 코인</span>
        <span className="font-semibold tabular-nums">{balance.toLocaleString()}</span>
        {admin && (
          <Link
            href="/wallet"
            className="text-xs rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-1 shadow-sm"
          >
            충전
          </Link>
        )}
      </div>

      <nav className="flex flex-wrap justify-center gap-2">
        {['all', ...allCategories].map((c) => {
          const active = c === activeCat;
          return (
            <Link
              key={c}
              href={buildHref({ cat: c })}
              className={`text-sm rounded-full px-4 py-1.5 border transition ${
                active
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-md shadow-indigo-500/25'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md hover:border-amber-400'
              }`}
            >
              {c === 'all' ? '전체' : categoryLabel(c)}
            </Link>
          );
        })}
      </nav>

      <Link
        href={buildHref({ hideOwned: !hideOwned })}
        className={`text-xs rounded-full px-3 py-1.5 border transition ${
          hideOwned
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md hover:border-amber-400'
        }`}
      >
        {hideOwned ? '전체 보기' : '미보유만 보기'}
      </Link>

      {err && <p className="text-sm text-red-500">{ERR_MSG[err] ?? err}</p>}

      {visibleItems.length === 0 ? (
        <p className="text-zinc-500">
          {hideOwned ? '미보유 아이템이 없습니다.' : '등록된 아이템이 없습니다.'}
        </p>
      ) : (
        <div className="w-full max-w-3xl flex flex-col gap-8">
          {[...grouped.entries()].map(([category, catItems]) => (
            <section key={category} className="flex flex-col gap-3">
              {activeCat === 'all' && (
                <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
                  {categoryLabel(category)}
                </h2>
              )}
              <ul
                className={`grid gap-4 ${
                  category === 'nickname_symbol'
                    ? 'grid-cols-2 sm:grid-cols-4'
                    : 'sm:grid-cols-2'
                }`}
              >
                {catItems.map((item) => {
                  const isOwned = ownedIds.has(item.id);
                  const affordable = balance >= item.price;
                  const isSymbol = item.category === 'nickname_symbol';
                  const symbol = isSymbol
                    ? (item.payload as { symbol?: string } | undefined)?.symbol
                    : null;
                  return (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md p-4 flex flex-col gap-2 shadow-lg shadow-orange-500/5 transition hover:-translate-y-0.5 hover:shadow-orange-500/10"
                    >
                      {isSymbol && symbol ? (
                        <span className="text-4xl text-center py-2">{symbol}</span>
                      ) : (
                        <span className="font-semibold">{item.name}</span>
                      )}
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 text-center tabular-nums">
                        {item.price.toLocaleString()} 코인
                      </span>
                      {isOwned ? (
                        <span className="text-sm text-center rounded-full px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          보유 중
                        </span>
                      ) : affordable ? (
                        <Link
                          href={`/shop/checkout/${item.id}`}
                          className="text-sm text-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-1.5 shadow-md shadow-indigo-500/25"
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
            </section>
          ))}
        </div>
      )}

      <Link href="/" className="text-sm text-zinc-500 hover:text-orange-500 transition">
        ← 홈으로
      </Link>
    </main>
  );
}
