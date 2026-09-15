import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/session';
import { getBalance, COIN_PACKAGES } from '@/lib/wallet';

const ERR_MSG: Record<string, string> = {
  bad_package: '잘못된 패키지',
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
    <main className="min-h-screen flex flex-col items-center p-8 gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-semibold">코인 지갑</h1>

      <div className="rounded border border-zinc-200 dark:border-zinc-800 px-6 py-4 bg-white dark:bg-zinc-900">
        <div className="text-sm text-zinc-500">보유 코인</div>
        <div className="text-2xl font-semibold">{balance.toLocaleString()} 코인</div>
      </div>

      {ok && <p className="text-sm text-emerald-600">충전 완료</p>}
      {err && <p className="text-sm text-red-500">{ERR_MSG[err] ?? err}</p>}

      <section className="w-full max-w-2xl flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
          충전 패키지
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {COIN_PACKAGES.map((pkg) => (
            <li
              key={pkg.coins}
              className="rounded border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-2 bg-white dark:bg-zinc-900"
            >
              <div className="text-lg font-semibold">{pkg.coins.toLocaleString()} 코인</div>
              <div className="text-sm text-zinc-500">{pkg.price.toLocaleString()}원</div>
              <Link
                href={`/wallet/topup/${pkg.coins}`}
                className="mt-1 text-sm text-center rounded bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5"
              >
                충전하기
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-3">
        <Link href="/shop" className="text-sm underline text-zinc-500">상점</Link>
        <Link href="/inventory" className="text-sm underline text-zinc-500">인벤토리</Link>
        <Link href="/" className="text-sm underline text-zinc-500">홈으로</Link>
      </div>
    </main>
  );
}