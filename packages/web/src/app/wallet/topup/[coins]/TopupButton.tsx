'use client';

import Script from 'next/script';
import { useState } from 'react';

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      payment: (opts: { customerKey: string }) => {
        requestPayment: (opts: Record<string, unknown>) => Promise<void>;
      };
    };
  }
}

interface Props {
  coins: number;
  amount: number;
  customerKey: string;
  clientKey: string;
}

export function TopupButton({ coins, amount, customerKey, clientKey }: Props) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPay() {
    if (!window.TossPayments) return;
    setBusy(true);
    setError(null);
    try {
      const tossPayments = window.TossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey });
      const rand = Math.random().toString(36).slice(2, 10);
      const orderId = `topup-${coins}-${rand}`;
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: amount },
        orderId,
        orderName: `코인 ${coins}개`,
        successUrl: `${window.location.origin}/wallet/topup/success`,
        failUrl: `${window.location.origin}/wallet/topup/fail`,
      });
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : '결제 창 열기 실패');
    }
  }

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v2/standard"
        onLoad={() => setReady(true)}
      />
      <button
        type="button"
        onClick={onPay}
        disabled={!ready || busy}
        className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2 text-sm font-semibold shadow-md shadow-indigo-500/25 disabled:opacity-50 transition"
      >
        {busy ? '결제 창 여는 중…' : ready ? '결제하기 (테스트)' : 'SDK 로딩 중…'}
      </button>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </>
  );
}
