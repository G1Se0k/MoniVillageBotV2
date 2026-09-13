import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Item } from '@moni/shared';
import { readSession } from '@/lib/session';

interface SuccessProps {
  params: Promise<{ id: string }>;
}

export default async function Success({ params }: SuccessProps) {
  const user = await readSession();
  if (!user) redirect('/');

  const { id } = await params;
  const item = await Item.findByPk(Number(id));
  if (!item) notFound();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-2xl font-semibold text-emerald-600">구매 완료</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        <span className="font-medium">{item.name}</span> 를 획득했어요.
      </p>
      <div className="flex gap-3">
        <Link href="/shop" className="text-sm underline text-zinc-500">
          상점으로
        </Link>
        <Link href="/" className="text-sm underline text-zinc-500">
          홈으로
        </Link>
      </div>
    </main>
  );
}
