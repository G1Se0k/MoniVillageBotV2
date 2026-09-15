import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { getBalance, COIN_PACKAGES } from '@/lib/wallet';

const ERR_MSG: Record<string, string> = {
  bad_package: '잘못된 패키지',
  missing_params: '결제 파라미터 누락',
  bad_order: '주문 ID 형식 오류',
  amount_mismatch: '결제 금액 불일치',
  PAY_PROCESS_CANCELED: '결제가 취소되었습니다',
  USER_CANCEL: '결제가 취소되었습니다',
  PAY_FAILED: '결제 실패',
};

interface WalletProps {
  searchParams: Promise<{ ok?: string; err?: string }>;
}

export default async function Wallet({ searchParams }: WalletProps) {
  const user = await readSession();
  if (!user) redirect('/');
  const { ok, err } = await searchParams;

  const balance = await getBalance(user.id);

  return (
    <main className="min-h-screen flex flex-col items-center p-6 gap-6">
      <header className="w-full max-w-3xl flex flex-col items-center gap-2 pt-4">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
          Moni Village
        </p>
        <h1 className="text-3xl font-bold tracking-tight">코인 지갑</h1>
      </header>

      <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md px-8 py-5 shadow-lg shadow-orange-500/10 flex flex-col items-center gap-1">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          보유 코인
        </div>
        <div className="text-3xl font-bold tabular-nums bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
          {balance.toLocaleString()}
        </div>
      </div>

      {ok && <p className="text-sm text-emerald-600">충전 완료</p>}
      {err && <p className="text-sm text-red-500">{ERR_MSG[err] ?? err}</p>}

      <section className="w-full max-w-2xl flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] text-center">
          충전 패키지
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {COIN_PACKAGES.map((pkg) => (
            <li
              key={pkg.coins}
              className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md p-5 flex flex-col items-center gap-2 shadow-lg shadow-orange-500/5 transition hover:-translate-y-0.5 hover:shadow-orange-500/10"
            >
              <div className="text-2xl font-bold tabular-nums">
                {pkg.coins.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">코인</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">
                ₩ {pkg.price.toLocaleString()}
              </div>
              <Link
                href={`/wallet/topup/${pkg.coins}`}
                className="mt-2 w-full text-sm text-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-1.5 shadow-md shadow-indigo-500/25"
              >
                충전하기
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-4 text-sm text-zinc-500">
        <Link href="/shop" className="hover:text-orange-500 transition">상점</Link>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <Link href="/inventory" className="hover:text-orange-500 transition">인벤토리</Link>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <Link href="/" className="hover:text-orange-500 transition">홈으로</Link>
      </div>
    </main>
  );
}
