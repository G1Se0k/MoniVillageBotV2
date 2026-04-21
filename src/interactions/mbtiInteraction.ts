import { EmbedBuilder, StringSelectMenuInteraction } from 'discord.js';
import { EMBED_COLORS } from '../utils/embed';
import { MbtiLog } from '../database/models/MbtiLog';
import { Member } from '../database/models/Member';
import { findMbtiGroupRoles } from '../database/models/Role';
import { applyMbtiRoleAndNick, mbtiTypeToPrefix, resolveDisplayType, resolveNewNickname } from './mbtiUtils';

export { resolveDisplayType, resolveNewNickname };

export async function handleMbtiSelect(interaction: StringSelectMenuInteraction) {
  const { guild, user } = interaction;
  if (!guild) return;

  const selectedType = interaction.values[0];

  const userRecord = await Member.findOne({ where: { user_id: user.id, guild_id: guild.id } });

  if (userRecord?.mbti_type === selectedType) {
    await interaction.update({
      embeds: [new EmbedBuilder().setColor(EMBED_COLORS.warning).setDescription(`이미 **${selectedType}**(으)로 선택되어 있습니다.`)],
      components: [],
    });
    return;
  }

  const [mbtiGroupRoles, , , member] = await Promise.all([
    findMbtiGroupRoles(guild.id),
    MbtiLog.create({ user_id: user.id, guild_id: guild.id, mbti_type: selectedType }),
    Member.upsert({ user_id: user.id, guild_id: guild.id, mbti_type: selectedType }),
    guild.members.fetch(user.id),
  ]);

  const prefix = mbtiTypeToPrefix(selectedType);
  const groupColor = EMBED_COLORS[prefix] ?? EMBED_COLORS.success;

  let roleAssigned = false;
  let roleName: string | undefined;
  let isOwner = guild.ownerId === user.id;

  try {
    const result = await applyMbtiRoleAndNick(guild, member, mbtiGroupRoles, selectedType);
    roleAssigned = result.roleAssigned;
    roleName = result.roleName;
    if (result.newNick) console.log(`[MBTI] Nickname updated to "${result.newNick}" for ${user.tag} (${user.id}) in guild ${guild.id}`);
    if (roleAssigned) console.log(`[MBTI] Role "${roleName}" assigned to ${user.tag} (${user.id}) in guild ${guild.id}`);
  } catch (err) {
    console.error(`[MBTI] Role/nickname update failed for ${user.tag} (${user.id}):`, err);
  }

  console.log(`[MBTI] ${user.tag} (${user.id}) selected ${selectedType} in guild ${guild.id}`);

  const desc = [`✅ MBTI 유형이 **${selectedType}**(으)로 저장되었습니다!`];
  if (roleAssigned && roleName) desc.push(`**${roleName}** 역할이 부여되었습니다.`);
  if (isOwner) desc.push('\n⚠️ 서버 소유자는 닉네임을 직접 변경해주세요.');

  await interaction.update({
    embeds: [new EmbedBuilder().setColor(groupColor as number).setDescription(desc.join('\n'))],
    components: [],
  });
}
