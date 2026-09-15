import { MessageFlags, ModalSubmitInteraction } from 'discord.js';
import { successEmbed, errorEmbed } from '../utils/embed';
import { Member, NicknameLog, CUSTOM_IDS } from '@moni/shared';
import { mbtiTypeToPrefix, resolveDisplayType, resolveNewNickname } from './mbtiUtils';

export async function handleNicknameModal(interaction: ModalSubmitInteraction) {
  const { guild, user } = interaction;
  if (!guild) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const newName = interaction.fields.getTextInputValue(CUSTOM_IDS.NICKNAME_INPUT);

  const [userRecord, member] = await Promise.all([
    Member.findOne({ where: { user_id: user.id, guild_id: guild.id } }),
    guild.members.fetch(user.id),
  ]);

  const mbtiType = userRecord?.mbti_type ?? 'NONE';
  const prefix = mbtiTypeToPrefix(mbtiType);
  const displayType = resolveDisplayType(member.nickname, member.displayName, mbtiType);
  const newNick = resolveNewNickname(member.nickname, member.displayName, displayType, prefix, newName, undefined, !!member.premiumSince);

  try {
    await Promise.all([
      member.setNickname(newNick),
      NicknameLog.create({ user_id: user.id, guild_id: guild.id, nickname: newNick }),
    ]);
    console.log(`[NICK] Nickname changed to "${newNick}" for ${user.id} in guild ${guild.id}`);
    await interaction.editReply({ embeds: [successEmbed(`닉네임이 **${newNick}**(으)로 변경되었습니다.`)] });
  } catch (err) {
    console.error(`[NICK] Nickname change failed for ${user.id} in guild ${guild.id}:`, err);
    await interaction.editReply({ embeds: [errorEmbed('닉네임 변경에 실패했습니다. 봇의 권한을 확인해주세요.')] });
  }
}
