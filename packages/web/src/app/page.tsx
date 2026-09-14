import Link from 'next/link';
import { MBTI_TYPES } from '@moni/shared';
import { readSession } from '@/lib/session';

interface HomeProps {
  searchParams: Promise<{ login_error?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const user = await readSession();
  const { login_error } = await searchParams;

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-semibold">Moni Village 채팅 꾸미기 샵</h1>
      <p className="text-zinc-600 dark:text-zinc-400">준비 중입니다.</p>
      <p className="text-sm text-zinc-500">
        shared 패키지 연결 확인: {MBTI_TYPES.length}개 MBTI 유형 로드됨
      </p>

      {login_error && (
        <p className="text-sm text-red-500">로그인 실패: {login_error}</p>
      )}

      {user ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" width={40} height={40} className="rounded-full" />
            )}
            <span className="text-sm">안녕하세요, {user.username}</span>
            <form action="/api/auth/logout" method="post">
              <button className="text-sm underline text-zinc-600 dark:text-zinc-400" type="submit">
                로그아웃
              </button>
            </form>
          </div>
          <div className="flex gap-3">
            <Link
              href="/shop"
              className="rounded bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium"
            >
              상점 가기 →
            </Link>
            <Link
              href="/inventory"
              className="rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium"
            >
              인벤토리
            </Link>
          </div>
        </div>
      ) : (
        <a
          href="/api/auth/login"
          className="rounded bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium"
        >
          Discord로 로그인
        </a>
      )}
    </main>
  );
}
