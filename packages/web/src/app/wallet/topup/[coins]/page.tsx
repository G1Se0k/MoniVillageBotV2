import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { packagePrice } from '@/lib/wallet';
import { TopupButton } from './TopupButton';

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

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-sm text-red-500">
          NEXT_PUBLIC_TOSS_CLIENT_KEY 환경변수가 설정되지 않았습니다.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <header className="flex flex-col items-center gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
          Moni Village
        </p>
        <h1 className="text-2xl font-bold tracking-tight">충전 확인</h1>
      </header>

      <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md p-6 w-full max-w-md flex flex-col gap-3 shadow-lg shadow-orange-500/10">
        <div className="flex justify-between">
          <span className="text-zinc-500">충전 수량</span>
          <span className="font-semibold tabular-nums">{coins.toLocaleString()} 코인</span>
        </div>
        <div className="flex justify-between border-t border-zinc-200/70 dark:border-zinc-800/70 pt-3">
          <span className="text-zinc-500">결제 금액</span>
          <span className="font-bold tabular-nums bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            ₩ {price.toLocaleString()}
          </span>
        </div>
      </div>

      <p className="text-xs text-amber-600 dark:text-amber-400 text-center max-w-md">
        ⚠ 테스트 모드 — 실제 결제되지 않습니다. 카드번호 4330-1234-1234-1234 등 테스트 카드로 진행.
      </p>

      <div className="flex gap-3 items-center">
        <Link
          href="/wallet"
          className="rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md px-4 py-2 text-sm hover:border-amber-400 transition"
        >
          취소
        </Link>
        <TopupButton
          coins={coins}
          amount={price}
          customerKey={user.id}
          clientKey={clientKey}
        />
      </div>
    </main>
  );
}
