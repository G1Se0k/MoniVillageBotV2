const WALLET_ALLOWED_USER_IDS = new Set(['269861612721012746']);
const API = 'https://discord.com/api/v10';

/** 지갑 페이지 접근 허용 여부 판정. */
export async function canAccessWallet(userId: string): Promise<boolean> {
  return WALLET_ALLOWED_USER_IDS.has(userId);
}

/** Discord 서버 멤버 여부 판정. TOKEN/GUILD_ID 미설정 시 true(게이팅 안 함). */
export async function isGuildMember(userId: string): Promise<boolean> {
  const token = process.env.TOKEN;
  const guildId = process.env.GUILD_ID;
  if (!token || !guildId) return true;
  const res = await fetch(`${API}/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 60 },
  });
  return res.ok;
}
