const CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error('TOSS_SECRET_KEY 미설정');
  const auth = Buffer.from(`${secretKey}:`).toString('base64');
  const res = await fetch(CONFIRM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'CONFIRM_FAILED' }));
    throw new Error(err.code || 'CONFIRM_FAILED');
  }
  return res.json();
}
