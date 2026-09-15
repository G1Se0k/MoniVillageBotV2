const API = 'https://discord.com/api/v10';

export interface GuildIcon {
  url: string;
  name: string;
}

/** Discord 서버 아이콘 URL을 봇 토큰으로 조회. 1시간 캐시. */
export async function getGuildIcon(size = 256): Promise<GuildIcon | null> {
  const token = process.env.TOKEN;
  const guildId = process.env.GUILD_ID;
  if (!token || !guildId) return null;

  const res = await fetch(`${API}/guilds/${guildId}`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { icon?: string | null; name?: string };
  if (!data.icon) return null;

  const ext = data.icon.startsWith('a_') ? 'gif' : 'png';
  return {
    url: `https://cdn.discordapp.com/icons/${guildId}/${data.icon}.${ext}?size=${size}`,
    name: data.name ?? '모니마을',
  };
}
