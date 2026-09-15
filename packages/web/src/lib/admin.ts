const WALLET_ALLOWED_USER_IDS = new Set(['269861612721012746']);

/** 지갑 페이지 접근 허용 여부 판정. */
export async function canAccessWallet(userId: string): Promise<boolean> {
  return WALLET_ALLOWED_USER_IDS.has(userId);
}
