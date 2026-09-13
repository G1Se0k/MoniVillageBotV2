import { EmbedBuilder, StringSelectMenuInteraction } from 'discord.js';
import { EMBED_COLORS } from '../utils/embed';
import { MbtiLog } from '../database/models/MbtiLog';
import { Member } from '../database/models/Member';
import { findMbtiGroupRoles } from '../database/models/Role';
import { applyMbtiRoleAndNick, mbtiTypeToPrefix } from './mbtiUtils';

export async function handleMbtiSelect(interaction: StringSelectMenuInteraction) {
  const { guild, user } = interaction;
  if (!guild) return;

  const selectedType = interaction.values[0];

  // 읽기 단계: 쓰기 없이 필요한 데이터를 모두 병렬로 조회
  const [mbtiGroupRoles, existingRecord, member] = await Promise.all([
    findMbtiGroupRoles(guild.id),
    Member.findOne({ where: { user_id: user.id, guild_id: guild.id } }),
    guild.members.fetch(user.id),
  ]);

  if (existingRecord?.mbti_type === selectedType) {
    await interaction.update({
      embeds: [new EmbedBuilder().setColor(EMBED_COLORS.warning).setDescription(`이미 **${selectedType}**(으)로 선택되어 있습니다.`)],
      components: [],
    });
    return;
  }

  // 쓰기 단계: 중복 체크 통과 후에만 DB에 반영
  await Promise.all([
    MbtiLog.create({ user_id: user.id, guild_id: guild.id, mbti_type: selectedType }),
    Member.upsert({ user_id: user.id, guild_id: guild.id, mbti_type: selectedType }),
  ]);

  const prefix = mbtiTypeToPrefix(selectedType);
  const groupColor = EMBED_COLORS[prefix];
  const isOwner = guild.ownerId === user.id;

  let result: Awaited<ReturnType<typeof applyMbtiRoleAndNick>> | null = null;
  try {
    result = await applyMbtiRoleAndNick(guild, member, mbtiGroupRoles, selectedType);
    if (result.newNick) console.log(`[MBTI] Nickname updated to "${result.newNick}" for ${user.tag} (${user.id}) in guild ${guild.id}`);
    if (result.roleAssigned) console.log(`[MBTI] Role "${result.roleName}" assigned to ${user.tag} (${user.id}) in guild ${guild.id}`);
  } catch (err) {
    console.error(`[MBTI] Role/nickname update failed for ${user.tag} (${user.id}):`, err);
  }

  console.log(`[MBTI] ${user.tag} (${user.id}) selected ${selectedType} in guild ${guild.id}`);

  const desc = [`✅ MBTI 유형이 **${selectedType}**(으)로 저장되었습니다!`];
  if (result?.roleAssigned && result.roleName) desc.push(`**${result.roleName}** 역할이 부여되었습니다.`);
  if (isOwner) desc.push('\n⚠️ 서버 소유자는 닉네임을 직접 변경해주세요.');

  await interaction.update({
    embeds: [new EmbedBuilder().setColor(groupColor).setDescription(desc.join('\n'))],
    components: [],
  });
}
