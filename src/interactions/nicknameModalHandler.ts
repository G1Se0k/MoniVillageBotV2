import { ModalSubmitInteraction } from 'discord.js';
import { MV_USER } from '../database/models/MV_USER';
import { MV_NICKNAME } from '../database/models/MV_NICKNAME';
import { resolveNewNickname } from './mbtiInteraction';
import { MbtiRolePrefix, CUSTOM_IDS } from '../constants/mbti';

export async function handleNicknameModal(interaction: ModalSubmitInteraction) {
  const { guild, user } = interaction;
  if (!guild) return;

  await interaction.deferReply({ ephemeral: true });

  const newName = interaction.fields.getTextInputValue(CUSTOM_IDS.NICKNAME_INPUT);

  const userRecord = await MV_USER.findOne({ where: { USER_ID: user.id, GUILD_ID: guild.id } });

  const mbtiType = userRecord?.MBTI_TYPE ?? 'NONE';
  const displayType = mbtiType === 'NONE' ? 'BABO' : mbtiType;
  const prefix = (mbtiType === 'NONE' ? 'NO' : mbtiType.substring(0, 2)) as MbtiRolePrefix;

  const member = await guild.members.fetch(user.id);
  const newNick = resolveNewNickname(member.nickname, member.displayName, displayType, prefix, newName);

  try {
    await member.setNickname(newNick);
    await MV_NICKNAME.create({ USER_ID: user.id, GUILD_ID: guild.id, NICKNAME: newNick });
    console.log(`[NICK] Nickname changed to "${newNick}" for ${user.id} in guild ${guild.id}`);
    await interaction.editReply({ content: `닉네임이 **${newNick}**(으)로 변경되었습니다.` });
  } catch (err) {
    console.error(`[NICK] Nickname change failed for ${user.id} in guild ${guild.id}:`, err);
    await interaction.editReply({ content: '닉네임 변경에 실패했습니다. 봇의 권한을 확인해주세요.' });
  }
}
