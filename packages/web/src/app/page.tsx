import Link from 'next/link';
import { readSession } from '@/lib/session';
import { getGuildIcon } from '@/lib/guildIcon';

interface HomeProps {
  searchParams: Promise<{ login_error?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const user = await readSession();
  const { login_error } = await searchParams;
  const guild = await getGuildIcon(256);

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <div className="flex flex-col items-center gap-4">
        {guild ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={guild.url}
            alt={guild.name}
            width={192}
            height={192}
            className="drop-shadow-xl"
          />
        ) : (
          <h1 className="text-4xl font-bold tracking-tight">Moni Village</h1>
        )}
        <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
          채팅 꾸미기 샵
        </p>
      </div>

      {login_error && (
        <p className="text-sm text-red-500">로그인 실패: {login_error}</p>
      )}

      {user ? (
        <div className="w-full max-w-md flex flex-col gap-5 rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md p-6 shadow-xl shadow-indigo-500/5">
          <div className="flex items-center gap-3">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                width={44}
                height={44}
                className="rounded-full ring-2 ring-indigo-500/40"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">환영합니다</p>
              <p className="font-semibold truncate">{user.username}</p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                className="text-xs rounded-full px-3 py-1 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                type="submit"
              >
                로그아웃
              </button>
            </form>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/shop"
              className="flex flex-col items-center gap-1 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-4 text-sm font-medium shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5"
            >
              <span className="text-xl">🛍️</span>
              <span>상점</span>
            </Link>
            <Link
              href="/inventory"
              className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-4 text-sm font-medium hover:border-indigo-400 dark:hover:border-indigo-500 transition hover:-translate-y-0.5"
            >
              <span className="text-xl">🎒</span>
              <span>인벤토리</span>
            </Link>
            <Link
              href="/wallet"
              className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-4 text-sm font-medium hover:border-indigo-400 dark:hover:border-indigo-500 transition hover:-translate-y-0.5"
            >
              <span className="text-xl">💰</span>
              <span>지갑</span>
            </Link>
          </div>
        </div>
      ) : (
        <a
          href="/api/auth/login"
          className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.077.077 0 0 0-.08.038c-.35.62-.734 1.43-1.005 2.066a18.27 18.27 0 0 0-5.487 0 12.51 12.51 0 0 0-1.02-2.066.08.08 0 0 0-.08-.038 19.74 19.74 0 0 0-3.76 1.169.07.07 0 0 0-.03.028C1.545 8.033.72 11.579.98 15.083a.083.083 0 0 0 .03.055 19.9 19.9 0 0 0 5.99 3.03.079.079 0 0 0 .085-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.104 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.373-.291a.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.075.075 0 0 1 .079.01c.121.099.247.198.373.292a.077.077 0 0 1-.006.128c-.598.349-1.22.646-1.873.891a.077.077 0 0 0-.041.105c.36.699.772 1.363 1.225 1.993a.078.078 0 0 0 .084.029 19.83 19.83 0 0 0 6-3.03.077.077 0 0 0 .032-.054c.5-4.048-.838-7.564-3.548-10.686a.061.061 0 0 0-.031-.028zM8.02 12.85c-1.183 0-2.157-1.086-2.157-2.42 0-1.334.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.334.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.947 2.42-2.157 2.42z" />
          </svg>
          Discord로 로그인
        </a>
      )}
    </main>
  );
}
