import { ModalSubmitInteraction } from 'discord.js';
import { MV_USER } from '../database/models/MV_USER';
import { MV_NICKNAME } from '../database/models/MV_NICKNAME';
import { resolveNewNickname } from './mbtiInteraction';
import { MbtiRolePrefix, CUSTOM_IDS, MBTI_TYPES } from '../constants/mbti';

const MBTI_TYPE_SET = new Set<string>([...MBTI_TYPES, 'BABO']);

export async function handleNicknameModal(interaction: ModalSubmitInteraction) {
  const { guild, user } = interaction;
  if (!guild) return;

  await interaction.deferReply({ ephemeral: true });

  const newName = interaction.fields.getTextInputValue(CUSTOM_IDS.NICKNAME_INPUT);

  const userRecord = await MV_USER.findOne({ where: { USER_ID: user.id, GUILD_ID: guild.id } });

  const mbtiType = userRecord?.MBTI_TYPE ?? 'NONE';
  const prefix = (mbtiType === 'NONE' ? 'NO' : mbtiType.substring(0, 2)) as MbtiRolePrefix;

  const member = await guild.members.fetch(user.id);

  // 현재 닉네임에서 타입 슬롯 추출 (e.g. "🟥 이름/LONG 🟥" → "LONG")
  const currentNickSource = member.nickname ?? member.displayName;
  const typeMatch = currentNickSource.match(/\/([A-Z]{4})\s/);
  const currentType = typeMatch?.[1];

  // 현재 타입이 4글자 영어이지만 MBTI/BABO가 아닌 경우 그대로 유지
  const displayType =
    currentType && !MBTI_TYPE_SET.has(currentType)
      ? currentType
      : mbtiType === 'NONE' ? 'BABO' : mbtiType;

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
