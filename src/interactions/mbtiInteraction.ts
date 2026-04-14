import { EmbedBuilder, StringSelectMenuInteraction } from 'discord.js';
import { EMBED_COLORS } from '../utils/embed';
import { MbtiLog } from '../database/models/MbtiLog';
import { Member } from '../database/models/Member';
import { findMbtiGroupRoles, MbtiRolePrefix } from '../database/models/Role';
import { GROUP_EMOJIS, MBTI_TYPE_SET, NICK_TYPE_REGEX } from '../constants/mbti';

const OUR_EMOJI_SET = new Set(Object.values(GROUP_EMOJIS));

/**
 * 닉네임에서 커스텀 4글자 타입을 보존하거나, mbtiType 기반으로 표시 타입을 결정합니다.
 * 커스텀 타입(MBTI/BABO가 아닌 4글자 영어)이 있으면 그대로 유지합니다.
 */
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
): string {
  const source = currentNick ?? displayName;

  // Use the first non-MBTI emoji found; fall back to MBTI group emoji
  const foundEmojis = [...source.matchAll(/\p{Emoji_Presentation}/gu)].map((m) => m[0]);
  const otherEmoji = foundEmojis.find((e) => !OUR_EMOJI_SET.has(e));
  const emoji = otherEmoji ?? GROUP_EMOJIS[prefix];

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

  const userRecord = await Member.findOne({ where: { user_id: user.id, guild_id: guild.id } });

  if (userRecord?.mbti_type === selectedType) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.warning)
      .setDescription(`이미 **${selectedType}**(으)로 선택되어 있습니다.`);
    await interaction.update({ embeds: [embed], components: [] });
    return;
  }

  const prefix = selectedType.substring(0, 2) as MbtiRolePrefix;

  const [mbtiGroupRoles] = await Promise.all([
    findMbtiGroupRoles(guild.id),
    MbtiLog.create({ user_id: user.id, guild_id: guild.id, mbti_type: selectedType }),
    Member.upsert({ user_id: user.id, guild_id: guild.id, mbti_type: selectedType }),
  ]);

  const matchingRole = mbtiGroupRoles.find((r) => r.name.startsWith(prefix));

  const isOwner = guild.ownerId === user.id;

  let roleAssigned = false;
  try {
    const member = await guild.members.fetch(user.id);
    const staleRoleIds = mbtiGroupRoles.map((r) => r.role_id).filter((id) => member.roles.cache.has(id));

    const displayType = resolveDisplayType(member.nickname, member.displayName, selectedType);
    const newNick = resolveNewNickname(member.nickname, member.displayName, displayType, prefix);

    await Promise.all([
      ...(staleRoleIds.length > 0 ? [member.roles.remove(staleRoleIds)] : []),
      ...(matchingRole ? [member.roles.add(matchingRole.role_id)] : []),
      ...(!isOwner ? [member.setNickname(newNick)] : []),
    ]);

    if (matchingRole) {
      roleAssigned = true;
      console.log(`[MBTI] Assigned role "${matchingRole.name}" to ${user.tag} (${user.id}) in guild ${guild.id}`);
    }
    if (!isOwner) {
      console.log(`[MBTI] Nickname updated to "${newNick}" for ${user.tag} (${user.id}) in guild ${guild.id}`);
    }
  } catch (err) {
    console.error(`[MBTI] Role assignment failed for ${user.tag} (${user.id}):`, err);
  }

  console.log(`[MBTI] ${user.tag} (${user.id}) selected ${selectedType} in guild ${guild.id}`);

  const groupColor = EMBED_COLORS[prefix as keyof typeof EMBED_COLORS] ?? EMBED_COLORS.success;

  const desc = [`✅ MBTI 유형이 **${selectedType}**(으)로 저장되었습니다!`];
  if (roleAssigned && matchingRole) desc.push(`**${matchingRole.name}** 역할이 부여되었습니다.`);
  if (isOwner) desc.push('\n⚠️ 서버 소유자는 닉네임을 직접 변경해주세요.');

  const embed = new EmbedBuilder()
    .setColor(groupColor as number)
    .setDescription(desc.join('\n'));

  await interaction.update({ embeds: [embed], components: [] });
}
