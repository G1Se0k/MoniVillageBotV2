'use client';

import type { ReactNode } from 'react';

export default function GuestBlockedButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => alert('게스트는 이용할 수 없는 기능입니다.')}
    >
      {children}
    </button>
  );
}
