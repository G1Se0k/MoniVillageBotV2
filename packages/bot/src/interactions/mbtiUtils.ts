import { Guild, GuildMember } from 'discord.js';
import {
  GROUP_EMOJIS,
  MBTI_ROLE_PREFIXES,
  MBTI_TYPE_SET,
  NICK_TYPE_REGEX,
  Role as DbRole,
  MbtiRolePrefix,
  getEquippedSymbol,
} from '@moni/shared';

const BOOSTER_EMOJI = '🟪';
const OUR_EMOJI_SET = new Set([...Object.values(GROUP_EMOJIS), BOOSTER_EMOJI]);

export function mbtiTypeToPrefix(mbtiType: string): MbtiRolePrefix {
  const prefix = mbtiType.substring(0, 2);
  return (MBTI_ROLE_PREFIXES as readonly string[]).includes(prefix) ? (prefix as MbtiRolePrefix) : 'NO';
}

export function resolveDisplayType(nickname: string | null, displayName: string, mbtiType: string): string {
  const source = nickname ?? displayName;
  const currentType = NICK_TYPE_REGEX.exec(source)?.[1];
  if (currentType && !MBTI_TYPE_SET.has(currentType)) return currentType;
  return mbtiType === 'NONE' ? 'BABO' : mbtiType;
}

export function resolveNewNickname(
  currentNick: string | null,
  displayName: string,
  selectedType: string,
  prefix: MbtiRolePrefix,
  overrideName?: string,
  equippedSymbol?: string | null,
  isBooster?: boolean,
): string {
  const source = currentNick ?? displayName;
  const emoji = equippedSymbol
    ?? (source.match(/\p{Emoji_Presentation}/gu) ?? []).find((e) => !OUR_EMOJI_SET.has(e))
    ?? (isBooster ? BOOSTER_EMOJI : GROUP_EMOJIS[prefix]);

  let baseName: string;
  if (overrideName) {
    baseName = [...overrideName].slice(-2).join('');
  } else {
    const botMatch = source.match(/^\S+ (.+?)\/[A-Z]{4} \S+$/);
    const rawName = botMatch ? botMatch[1] : source;
    baseName = [...rawName].slice(-2).join('');
  }

  return `${emoji} ${baseName}/${selectedType} ${emoji}`;
}

export interface ApplyMbtiResult {
  roleAssigned: boolean;
  nickUpdated: boolean;
  roleName?: string;
  newNick?: string;
}

export async function applyMbtiRoleAndNick(
  guild: Guild,
  member: GuildMember,
  mbtiGroupRoles: DbRole[],
  mbtiType: string,
): Promise<ApplyMbtiResult> {
  const prefix = mbtiTypeToPrefix(mbtiType);
  const matchingRole = mbtiGroupRoles.find((r) => r.name.startsWith(prefix));
  const isOwner = guild.ownerId === member.id;

  const staleRoleIds = mbtiGroupRoles.map((r) => r.role_id).filter((id) => member.roles.cache.has(id));
  const displayType = mbtiType === 'NONE' ? 'BABO' : mbtiType;
  const equippedSymbol = await getEquippedSymbol(member.id);
  const newNick = resolveNewNickname(member.nickname, member.displayName, displayType, prefix, undefined, equippedSymbol, !!member.premiumSince);

  await Promise.all([
    ...(staleRoleIds.length > 0 ? [member.roles.remove(staleRoleIds)] : []),
    ...(matchingRole ? [member.roles.add(matchingRole.role_id)] : []),
    ...(!isOwner ? [member.setNickname(newNick)] : []),
  ]);

  return {
    roleAssigned: !!matchingRole,
    nickUpdated: !isOwner,
    roleName: matchingRole?.name,
    newNick: !isOwner ? newNick : undefined,
  };
}
