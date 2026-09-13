import { MBTI_TYPES } from '@moni/shared';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-semibold">Moni Village 채팅 꾸미기 샵</h1>
      <p className="text-zinc-600 dark:text-zinc-400">준비 중입니다.</p>
      <p className="text-sm text-zinc-500">
        shared 패키지 연결 확인: {MBTI_TYPES.length}개 MBTI 유형 로드됨
      </p>
    </main>
  );
}
