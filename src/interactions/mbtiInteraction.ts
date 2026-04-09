import { StringSelectMenuInteraction } from 'discord.js';
import { MV_MBTI } from '../database/models/MV_MBTI';
import { MV_USER } from '../database/models/MV_USER';
import { findMbtiGroupRoles, MbtiRolePrefix } from '../database/models/MV_ROLE';

const MBTI_GROUP_EMOJIS: Record<MbtiRolePrefix, string> = {
  IS: '🟩',
  IN: '🟦',
  ES: '🟥',
  EN: '🟧',
  NO: '⬛',
};

const OUR_EMOJI_SET = new Set(Object.values(MBTI_GROUP_EMOJIS));

export function resolveNewNickname(
  currentNick: string | null,
  displayName: string,
  selectedType: string,
  prefix: MbtiRolePrefix,
  overrideName?: string,
): string {
  const source = currentNick ?? displayName;

  // Use the first non-MBTI emoji found; fall back to MBTI group emoji
  const foundEmojis = [...source.matchAll(/\p{Emoji_Presentation}/gu)].map((m) => m[0]);
  const otherEmoji = foundEmojis.find((e) => !OUR_EMOJI_SET.has(e));
  const emoji = otherEmoji ?? MBTI_GROUP_EMOJIS[prefix];

  // overrideName이 있으면 직접 사용, 없으면 source에서 이름 추출
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

export async function handleMbtiSelect(interaction: StringSelectMenuInteraction) {
  const { guild, user } = interaction;
  if (!guild) return;

  const selectedType = interaction.values[0];

  const userRecord = await MV_USER.findOne({ where: { USER_ID: user.id, GUILD_ID: guild.id } });

  if (userRecord?.MBTI_TYPE === selectedType) {
    await interaction.update({
      content: `이미 **${selectedType}**(으)로 선택되어 있습니다.`,
      components: [],
    });
    return;
  }

  const prefix = selectedType.substring(0, 2) as MbtiRolePrefix;

  const [mbtiGroupRoles] = await Promise.all([
    findMbtiGroupRoles(guild.id),
    MV_MBTI.create({ USER_ID: user.id, GUILD_ID: guild.id, MBTI_TYPE: selectedType }),
    MV_USER.upsert({ USER_ID: user.id, GUILD_ID: guild.id, MBTI_TYPE: selectedType }),
  ]);

  const matchingRole = mbtiGroupRoles.find((r) => r.ROLE_NAME.startsWith(prefix));

  const isOwner = guild.ownerId === user.id;

  let roleAssigned = false;
  try {
    const member = await guild.members.fetch(user.id);
    const staleRoleIds = mbtiGroupRoles.map((r) => r.ROLE_ID).filter((id) => member.roles.cache.has(id));
    if (staleRoleIds.length > 0) await member.roles.remove(staleRoleIds);
    if (matchingRole) {
      await member.roles.add(matchingRole.ROLE_ID);
      roleAssigned = true;
      console.log(`[MBTI] Assigned role "${matchingRole.ROLE_NAME}" to ${user.tag} (${user.id}) in guild ${guild.id}`);
    }

    if (!isOwner) {
      const newNick = resolveNewNickname(member.nickname, member.displayName, selectedType === 'NONE' ? 'BABO' : selectedType, prefix);
      await member.setNickname(newNick);
      console.log(`[MBTI] Nickname updated to "${newNick}" for ${user.tag} (${user.id}) in guild ${guild.id}`);
    }
  } catch (err) {
    console.error(`[MBTI] Role assignment failed for ${user.tag} (${user.id}):`, err);
  }

  console.log(`[MBTI] ${user.tag} (${user.id}) selected ${selectedType} in guild ${guild.id}`);

  const ownerNotice = isOwner
    ? '\n\n⚠️ 서버 소유자는 봇이 닉네임을 변경할 수 없습니다. 닉네임은 직접 변경해주세요.'
    : '';

  await interaction.update({
    content: `✅ MBTI 유형이 **${selectedType}**(으)로 저장되었습니다!${roleAssigned && matchingRole ? ` **${matchingRole.ROLE_NAME}** 역할이 부여되었습니다.` : ''}${ownerNotice}`,
    components: [],
  });
}
