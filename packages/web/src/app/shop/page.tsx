import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Item, UserItem, categoryLabel } from '@moni/shared';
import { readSession } from '@/lib/session';
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

  const [items, owned, balance] = await Promise.all([
    Item.findAll({ where: { active: true }, order: [['category', 'ASC'], ['id', 'ASC']] }),
    UserItem.findAll({ where: { user_id: user.id }, attributes: ['item_id'] }),
    getBalance(user.id),
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
    <main className="min-h-screen flex flex-col items-center p-8 gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-semibold">채팅 꾸미기 샵</h1>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-zinc-500">보유 코인</span>
        <span className="font-semibold">{balance.toLocaleString()}</span>
        <Link href="/wallet" className="underline text-indigo-600 dark:text-indigo-400">
          충전
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2">
        {['all', ...allCategories].map((c) => {
          const active = c === activeCat;
          return (
            <Link
              key={c}
              href={buildHref({ cat: c })}
              className={`text-sm rounded-full px-3 py-1 border ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {c === 'all' ? '전체' : categoryLabel(c)}
            </Link>
          );
        })}
      </nav>

      <Link
        href={buildHref({ hideOwned: !hideOwned })}
        className={`text-xs rounded px-3 py-1.5 border ${
          hideOwned
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
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
                <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
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
                      className="rounded border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-2 bg-white dark:bg-zinc-900"
                    >
                      {isSymbol && symbol ? (
                        <span className="text-4xl text-center py-2">{symbol}</span>
                      ) : (
                        <span className="font-medium">{item.name}</span>
                      )}
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
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
            </section>
          ))}
        </div>
      )}

      <Link href="/" className="text-sm underline text-zinc-500">← 홈으로</Link>
    </main>
  );
}
