const API = 'https://discord.com/api/v10';
const ADMINISTRATOR = BigInt(0x8);

interface DiscordRole { id: string; permissions: string; }
interface DiscordMember { roles: string[]; }
interface DiscordGuild { id: string; owner_id: string; roles: DiscordRole[]; }

async function fetchGuild(): Promise<DiscordGuild | null> {
  const token = process.env.TOKEN;
  const guildId = process.env.GUILD_ID;
  if (!token || !guildId) return null;
  const res = await fetch(`${API}/guilds/${guildId}`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json() as Promise<DiscordGuild>;
}

async function fetchMember(userId: string): Promise<DiscordMember | null> {
  const token = process.env.TOKEN;
  const guildId = process.env.GUILD_ID;
  if (!token || !guildId) return null;
  const res = await fetch(`${API}/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${token}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json() as Promise<DiscordMember>;
}

/** Discord 서버에서 Administrator 권한을 가진 사용자인지 판정. 서버 오너 포함. */
export async function isGuildAdmin(userId: string): Promise<boolean> {
  const [guild, member] = await Promise.all([fetchGuild(), fetchMember(userId)]);
  if (!guild || !member) return false;
  if (guild.owner_id === userId) return true;
  const memberRoles = new Set(member.roles);
  return guild.roles.some(
    (r) =>
      (r.id === guild.id || memberRoles.has(r.id)) &&
      (BigInt(r.permissions) & ADMINISTRATOR) !== BigInt(0),
  );
}
