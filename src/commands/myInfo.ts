import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../types/slashCommand';
import { Member } from '../database/models/Member';
import { MbtiLog } from '../database/models/MbtiLog';
import { NicknameLog } from '../database/models/NicknameLog';
import { EMBED_COLORS } from '../utils/embed';
import { COOLDOWN_MS, GROUP_EMOJIS } from '../constants/mbti';

export const myInfo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('내정보')
    .setDescription('나의 등록 정보를 조회합니다.'),
  handlesDeferral: true,
  execute: async (_, interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { guild, user } = interaction;
    if (!guild) return;

    const [userRecord, lastMbti, lastNick] = await Promise.all([
      Member.findOne({ where: { user_id: user.id, guild_id: guild.id } }),
      MbtiLog.findOne({ where: { user_id: user.id, guild_id: guild.id }, order: [['created_at', 'DESC']] }),
      NicknameLog.findOne({ where: { user_id: user.id, guild_id: guild.id }, order: [['created_at', 'DESC']] }),
    ]);

    if (!userRecord) {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.error)
        .setDescription('등록된 정보가 없습니다. 서버 관리자에게 문의해주세요.');
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const mbtiType = userRecord.mbti_type;
    const group = mbtiType === 'NONE' ? 'NO' : mbtiType.substring(0, 2);
    const groupEmoji = GROUP_EMOJIS[group as keyof typeof GROUP_EMOJIS] ?? '⬛';
    const color = EMBED_COLORS[group as keyof typeof EMBED_COLORS] ?? EMBED_COLORS.primary;

    // 닉네임 쿨다운 계산
    let cooldownText = '지금 변경 가능';
    if (lastNick) {
      const elapsed = Date.now() - new Date(lastNick.created_at).getTime();
      if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
        cooldownText = `${remaining}일 후 변경 가능`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(color as number)
      .setTitle(`${user.displayName}의 정보`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        {
          name: 'MBTI',
          value: mbtiType === 'NONE' ? '미설정' : `**${mbtiType}**`,
          inline: true,
        },
        {
          name: '그룹',
          value: `${groupEmoji} ${group}`,
          inline: true,
        },
        {
          name: '마지막 MBTI 변경',
          value: lastMbti ? new Date(lastMbti.created_at).toLocaleString('ko-KR') : '없음',
          inline: false,
        },
        {
          name: '마지막 닉네임',
          value: lastNick ? `${lastNick.nickname}\n${new Date(lastNick.created_at).toLocaleString('ko-KR')}` : '없음',
          inline: true,
        },
        {
          name: '닉네임 변경',
          value: cooldownText,
          inline: true,
        },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
