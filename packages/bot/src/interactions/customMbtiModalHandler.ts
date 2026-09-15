import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, ModalSubmitInteraction } from 'discord.js';
import { Op } from 'sequelize';
import { EMBED_COLORS } from '../utils/embed';
import { MbtiLog, Member, MBTI_TYPES, MBTI_TYPE_SET, CUSTOM_IDS, findMbtiGroupRoles, getEquippedSymbol } from '@moni/shared';
import { applyMbtiRoleAndNick, mbtiTypeToPrefix, resolveNewNickname } from './mbtiUtils';

export async function handleCustomMbtiModal(interaction: ModalSubmitInteraction) {
  const { guild, user } = interaction;
  if (!guild) return;

  const customType = interaction.fields.getTextInputValue(CUSTOM_IDS.CUSTOM_MBTI_INPUT).toUpperCase();

  if (!/^[A-Z]{4}$/.test(customType)) {
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(EMBED_COLORS.warning).setDescription('❌ 4글자 영문자만 입력할 수 있습니다.')],
      ephemeral: true,
    });
    return;
  }

  if (MBTI_TYPE_SET.has(customType)) {
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(EMBED_COLORS.warning).setDescription(`**${customType}**은 표준 MBTI 유형입니다. \`/mbti 설정\`을 사용해주세요.`)],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const [existingRecord, member] = await Promise.all([
    Member.findOne({ where: { user_id: user.id, guild_id: guild.id } }),
    guild.members.fetch(user.id),
  ]);

  if (existingRecord?.mbti_type === customType) {
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(EMBED_COLORS.warning).setDescription(`이미 **${customType}**(으)로 설정되어 있습니다.`)],
    });
    return;
  }

  await Promise.all([
    MbtiLog.create({ user_id: user.id, guild_id: guild.id, mbti_type: customType }),
    Member.upsert({ user_id: user.id, guild_id: guild.id, mbti_type: customType }),
  ]);

  // 그룹 역할은 변경하지 않고 닉네임만 업데이트 (커스텀 타입의 prefix로는 그룹 매칭 불가)
  const isOwner = guild.ownerId === user.id;
  let nickUpdated = false;

  if (!isOwner) {
    try {
      const prefix = mbtiTypeToPrefix(existingRecord?.mbti_type ?? 'NONE');
      const equippedSymbol = await getEquippedSymbol(user.id);
      const newNick = resolveNewNickname(member.nickname, member.displayName, customType, prefix, undefined, equippedSymbol, !!member.premiumSince);
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

  await interaction.editReply({
    embeds: [new EmbedBuilder().setColor(EMBED_COLORS.success).setDescription(desc.join('\n'))],
  });
}

export async function handleCustomMbtiReset(interaction: ChatInputCommandInteraction) {
  const { guild, user } = interaction;
  if (!guild) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const userRecord = await Member.findOne({ where: { user_id: user.id, guild_id: guild.id } });

  if (!userRecord || MBTI_TYPE_SET.has(userRecord.mbti_type)) {
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(EMBED_COLORS.warning).setDescription('현재 커스텀 MBTI가 설정되어 있지 않습니다.')],
    });
    return;
  }

  const recentLog = await MbtiLog.findOne({
    where: { user_id: user.id, guild_id: guild.id, mbti_type: { [Op.in]: [...MBTI_TYPES] } },
    order: [['created_at', 'DESC']],
  });

  const revertType = recentLog?.mbti_type ?? 'NONE';

  const [mbtiGroupRoles, , , member] = await Promise.all([
    findMbtiGroupRoles(guild.id),
    MbtiLog.create({ user_id: user.id, guild_id: guild.id, mbti_type: revertType }),
    Member.upsert({ user_id: user.id, guild_id: guild.id, mbti_type: revertType }),
    guild.members.fetch(user.id),
  ]);

  try {
    const result = await applyMbtiRoleAndNick(guild, member, mbtiGroupRoles, revertType);
    if (result.newNick) console.log(`[MBTI] Custom MBTI reset, nickname set to "${result.newNick}" for ${user.tag} (${user.id}) in guild ${guild.id}`);
  } catch (err) {
    console.error(`[MBTI] Custom MBTI reset failed for ${user.tag} (${user.id}):`, err);
  }

  console.log(`[MBTI] ${user.tag} (${user.id}) reset custom MBTI to "${revertType}" in guild ${guild.id}`);

  const baseMsg = revertType === 'NONE'
    ? '커스텀 MBTI가 초기화되었습니다. `/mbti 설정`으로 MBTI를 선택해주세요.'
    : `커스텀 MBTI가 초기화되었습니다. **${revertType}**(으)로 되돌아갔습니다.`;
  const desc = [baseMsg];
  if (guild.ownerId === user.id) desc.push('⚠️ 서버 소유자는 닉네임을 직접 변경해주세요.');

  await interaction.editReply({
    embeds: [new EmbedBuilder().setColor(EMBED_COLORS.success).setDescription(desc.join('\n'))],
  });
}
