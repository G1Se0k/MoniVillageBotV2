import { Member, GROUP_EMOJIS, MBTI_ROLE_PREFIXES, type MbtiRolePrefix } from '@moni/shared';

const API = 'https://discord.com/api/v10';

function mbtiPrefix(mbtiType: string): MbtiRolePrefix {
  const p = mbtiType.substring(0, 2);
  return (MBTI_ROLE_PREFIXES as readonly string[]).includes(p) ? (p as MbtiRolePrefix) : 'NO';
}

async function fetchNick(userId: string, guildId: string, token: string): Promise<string | null> {
  const res = await fetch(`${API}/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { nick?: string | null };
  return data.nick ?? null;
}

async function patchNick(userId: string, guildId: string, token: string, nick: string) {
  const res = await fetch(`${API}/guilds/${guildId}/members/${userId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nick }),
  });
  if (!res.ok) {
    console.error(`[discordNickname] PATCH ${res.status}: ${await res.text().catch(() => '')}`);
  }
}

/**
 * 심볼(equipped) → 유저 닉네임의 양옆 이모지 교체.
 * symbol=null이면 MBTI 그룹 이모지로 롤백.
 * 봇 포맷(`emoji baseName/MBTI emoji`)이 아니면 스킵.
 */
export async function applySymbolToNickname(userId: string, symbol: string | null) {
  const token = process.env.TOKEN;
  const guildId = process.env.GUILD_ID;
  if (!token || !guildId) {
    console.warn('[discordNickname] TOKEN 또는 GUILD_ID 미설정 — 닉네임 갱신 스킵');
    return;
  }

  let effective = symbol;
  if (!effective) {
    const member = await Member.findOne({ where: { user_id: userId, guild_id: guildId } });
    effective = member ? GROUP_EMOJIS[mbtiPrefix(member.mbti_type)] : GROUP_EMOJIS.NO;
  }

  const currentNick = await fetchNick(userId, guildId, token);
  if (!currentNick) return;

  const first = currentNick.indexOf(' ');
  const last = currentNick.lastIndexOf(' ');
  if (first === -1 || last === first) return;

  const middle = currentNick.slice(first + 1, last);
  const newNick = `${effective} ${middle} ${effective}`;
  if (newNick === currentNick) return;

  await patchNick(userId, guildId, token, newNick);
}
