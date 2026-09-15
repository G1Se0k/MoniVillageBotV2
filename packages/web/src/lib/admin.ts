const WALLET_ALLOWED_USER_IDS = new Set(['269861612721012746']);
const API = 'https://discord.com/api/v10';

/** 지갑 페이지 접근 허용 여부 판정. */
export async function canAccessWallet(userId: string): Promise<boolean> {
  return WALLET_ALLOWED_USER_IDS.has(userId);
}

export interface GuildMemberInfo { nick: string | null; }

/** Discord 서버 멤버 조회. null이면 비멤버. TOKEN/GUILD_ID 미설정 시 빈 멤버 반환(게이팅 안 함). */
export async function getGuildMember(userId: string): Promise<GuildMemberInfo | null> {
  const token = process.env.TOKEN;
  const guildId = process.env.GUILD_ID;
  if (!token || !guildId) return { nick: null };
  const res = await fetch(`${API}/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { nick?: string | null };
  return { nick: data.nick ?? null };
}
