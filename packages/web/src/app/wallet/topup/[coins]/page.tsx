import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { packagePrice } from '@/lib/wallet';
import { topupWallet } from '@/lib/topup';

interface TopupProps {
  params: Promise<{ coins: string }>;
}

export default async function Topup({ params }: TopupProps) {
  const user = await readSession();
  if (!user) redirect('/');

  const { coins: coinsStr } = await params;
  const coins = Number(coinsStr);
  const price = packagePrice(coins);
  if (!price) notFound();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-2xl font-semibold">충전 확인</h1>

      <div className="rounded border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md flex flex-col gap-3 bg-white dark:bg-zinc-900">
        <div className="flex justify-between">
          <span className="text-zinc-500">충전 수량</span>
          <span className="font-medium">{coins.toLocaleString()} 코인</span>
        </div>
        <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <span className="text-zinc-500">결제 금액</span>
          <span className="font-semibold">{price.toLocaleString()}원</span>
        </div>
      </div>

      <p className="text-xs text-amber-600 dark:text-amber-400">
        ⚠ 테스트 모드 — 실제 결제되지 않습니다.
      </p>

      <form action={topupWallet} className="flex gap-3">
        <input type="hidden" name="coins" value={coins} />
        <Link
          href="/wallet"
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
