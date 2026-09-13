import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Item } from '@moni/shared';
import { readSession } from '@/lib/session';
import { purchaseItem } from '@/lib/purchase';

interface CheckoutProps {
  params: Promise<{ id: string }>;
}

export default async function Checkout({ params }: CheckoutProps) {
  const user = await readSession();
  if (!user) redirect('/');

  const { id } = await params;
  const item = await Item.findByPk(Number(id));
  if (!item || !item.active) notFound();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-2xl font-semibold">결제 확인</h1>

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
          <span className="text-zinc-500">결제 금액</span>
          <span className="font-semibold">{item.price.toLocaleString()}원</span>
        </div>
      </div>

      <p className="text-xs text-amber-600 dark:text-amber-400">
        ⚠ 테스트 모드 — 실제 결제되지 않습니다.
      </p>

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
          결제하기 (테스트)
        </button>
      </form>
    </main>
  );
}
