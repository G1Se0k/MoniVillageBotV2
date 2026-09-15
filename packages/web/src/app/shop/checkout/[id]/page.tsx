import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Item } from '@moni/shared';
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
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-2xl font-semibold">구매 확인</h1>

      <div className="rounded border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md flex flex-col gap-3 bg-white dark:bg-zinc-900">
        <div className="flex justify-between">
          <span className="text-zinc-500">아이템</span>
          <span className="font-medium">{item.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">카테고리</span>
          <span>{item.category}</span>
        </div>
        <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <span className="text-zinc-500">가격</span>
          <span className="font-semibold">{item.price.toLocaleString()} 코인</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">보유 코인</span>
          <span className={affordable ? '' : 'text-red-500'}>
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
            className="rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
          >
            취소
          </Link>
          <button
            type="submit"
            className="rounded bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium"
          >
            구매하기
          </button>
        </form>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/shop"
            className="rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
          >
            상점으로
          </Link>
          <Link
            href="/wallet"
            className="rounded bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium"
          >
            코인 충전
          </Link>
        </div>
      )}
    </main>
  );
}
