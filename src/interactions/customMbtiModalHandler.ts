import { EmbedBuilder, ModalSubmitInteraction } from 'discord.js';
import { EMBED_COLORS } from '../utils/embed';
import { MbtiLog } from '../database/models/MbtiLog';
import { Member } from '../database/models/Member';
import { MBTI_TYPE_SET, CUSTOM_IDS } from '../constants/mbti';
import { MbtiRolePrefix } from '../database/models/Role';
import { resolveNewNickname } from './mbtiInteraction';

export async function handleCustomMbtiModal(interaction: ModalSubmitInteraction) {
  const { guild, user } = interaction;
  if (!guild) return;

  const rawInput = interaction.fields.getTextInputValue(CUSTOM_IDS.CUSTOM_MBTI_INPUT);
  const customType = rawInput.toUpperCase();

  if (!/^[A-Z]{4}$/.test(customType)) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.warning)
      .setDescription('❌ 4글자 영문자만 입력할 수 있습니다.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (MBTI_TYPE_SET.has(customType)) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.warning)
      .setDescription(`**${customType}**은 표준 MBTI 유형입니다. </mbti:설정>을 사용해주세요.`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const existingRecord = await Member.findOne({ where: { user_id: user.id, guild_id: guild.id } });

  if (existingRecord?.mbti_type === customType) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.warning)
      .setDescription(`이미 **${customType}**(으)로 설정되어 있습니다.`);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // 현재 MBTI 그룹 prefix 결정 (닉네임 이모지 보존용)
  const currentType = existingRecord?.mbti_type ?? 'NONE';
  const prefix = (currentType === 'NONE' || !['IS', 'IN', 'ES', 'EN'].includes(currentType.substring(0, 2))
    ? 'NO'
    : currentType.substring(0, 2)) as MbtiRolePrefix;

  await Promise.all([
    MbtiLog.create({ user_id: user.id, guild_id: guild.id, mbti_type: customType }),
    Member.upsert({ user_id: user.id, guild_id: guild.id, mbti_type: customType }),
  ]);

  const isOwner = guild.ownerId === user.id;
  let nickUpdated = false;

  if (!isOwner) {
    try {
      const member = await guild.members.fetch(user.id);
      const newNick = resolveNewNickname(member.nickname, member.displayName, customType, prefix);
      await member.setNickname(newNick);
      nickUpdated = true;
      console.log(`[MBTI] Custom type "${customType}" nickname set to "${newNick}" for ${user.tag} (${user.id}) in guild ${guild.id}`);
    } catch (err) {
      console.error(`[MBTI] Custom MBTI nickname update failed for ${user.tag} (${user.id}):`, err);
    }
  }

  console.log(`[MBTI] ${user.tag} (${user.id}) set custom MBTI "${customType}" in guild ${guild.id}`);

  const desc = [`✨ 커스텀 MBTI가 **${customType}**(으)로 설정되었습니다!`];
  if (!nickUpdated && !isOwner) desc.push('⚠️ 닉네임 변경에 실패했습니다. 봇의 권한을 확인해주세요.');
  if (isOwner) desc.push('⚠️ 서버 소유자는 닉네임을 직접 변경해주세요.');

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.success)
    .setDescription(desc.join('\n'));

  await interaction.editReply({ embeds: [embed] });
}