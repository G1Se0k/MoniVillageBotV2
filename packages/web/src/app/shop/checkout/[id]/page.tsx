import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Item, categoryLabel } from '@moni/shared';
import { readSession } from '@/lib/session';
import { getBalance } from '@/lib/wallet';
import { purchaseItem } from '@/lib/purchase';

const ERR_MSG: Record<string, string> = {
  insufficient: '코인이 부족합니다',
};

interface CheckoutProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}

export default async function Checkout({ params, searchParams }: CheckoutProps) {
  const user = await readSession();
  if (!user) redirect('/');

  const { id } = await params;
  const { err } = await searchParams;

  const [item, balance] = await Promise.all([
    Item.findByPk(Number(id)),
    getBalance(user.id),
  ]);
  if (!item || !item.active) notFound();
  const affordable = balance >= item.price;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <header className="flex flex-col items-center gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
          Moni Village
        </p>
        <h1 className="text-2xl font-bold tracking-tight">구매 확인</h1>
      </header>

      <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md p-6 w-full max-w-md flex flex-col gap-3 shadow-lg shadow-orange-500/10">
        <div className="flex justify-between">
          <span className="text-zinc-500">아이템</span>
          <span className="font-semibold">{item.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">카테고리</span>
          <span>{categoryLabel(item.category)}</span>
        </div>
        <div className="flex justify-between border-t border-zinc-200/70 dark:border-zinc-800/70 pt-3">
          <span className="text-zinc-500">가격</span>
          <span className="font-bold tabular-nums bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            {item.price.toLocaleString()} 코인
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">보유 코인</span>
          <span className={`tabular-nums ${affordable ? '' : 'text-red-500'}`}>
            {balance.toLocaleString()} 코인
          </span>
        </div>
      </div>

      {err && <p className="text-sm text-red-500">{ERR_MSG[err] ?? err}</p>}

      {affordable ? (
        <form action={purchaseItem} className="flex gap-3">
          <input type="hidden" name="itemId" value={item.id} />
          <Link
            href="/shop"
            className="rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md px-4 py-2 text-sm hover:border-amber-400 transition"
          >
            취소
          </Link>
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2 text-sm font-semibold shadow-md shadow-indigo-500/25 transition"
          >
            구매하기
          </button>
        </form>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/shop"
            className="rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md px-4 py-2 text-sm hover:border-amber-400 transition"
          >
            상점으로
          </Link>
          <Link
            href="/wallet"
            className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2 text-sm font-semibold shadow-md shadow-indigo-500/25 transition"
          >
            코인 충전
          </Link>
        </div>
      )}
    </main>
  );
}
