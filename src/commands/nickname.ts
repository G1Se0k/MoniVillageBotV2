import { ActionRowBuilder, MessageFlags, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { infoEmbed, warnEmbed } from '../utils/embed';
import { SlashCommand } from '../types/slashCommand';
import { CUSTOM_IDS, COOLDOWN_DAYS, COOLDOWN_MS } from '../constants/mbti';
import { NicknameLog } from '../database/models/NicknameLog';

export const nickname: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('닉네임')
    .setDescription('닉네임을 관리합니다.')
    .addSubcommand((sub) => sub.setName('변경').setDescription('닉네임을 변경합니다.'))
    .addSubcommand((sub) => sub.setName('히스토리').setDescription('나의 닉네임 변경 히스토리를 조회합니다.')),
  handlesDeferral: true,
  execute: async (_, interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '변경') {
      const { user, guild } = interaction;
      if (!guild) return;

      const lastChange = await NicknameLog.findOne({
        where: { user_id: user.id, guild_id: guild.id },
        order: [['created_at', 'DESC']],
      });

      if (guild.ownerId === user.id) {
        await interaction.reply({ embeds: [warnEmbed('서버 소유자는 봇이 닉네임을 변경할 수 없습니다.')], flags: MessageFlags.Ephemeral });
        return;
      }

      if (lastChange) {
        const elapsed = Date.now() - new Date(lastChange.created_at).getTime();
        if (elapsed < COOLDOWN_MS) {
          const remaining = Math.ceil((COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
          await interaction.reply({
            embeds: [warnEmbed(`닉네임 변경은 마지막 변경으로부터 **${COOLDOWN_DAYS}일** 후에 가능합니다.\n**${remaining}일** 후에 다시 시도해주세요.`)],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      const modal = new ModalBuilder()
        .setCustomId(CUSTOM_IDS.NICKNAME_MODAL)
        .setTitle('닉네임 변경');

      const nameInput = new TextInputBuilder()
        .setCustomId(CUSTOM_IDS.NICKNAME_INPUT)
        .setLabel('닉네임 (2글자)')
        .setStyle(TextInputStyle.Short)
        .setMinLength(2)
        .setMaxLength(2)
        .setPlaceholder('변경할 닉네임을 입력하세요')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput));
      await interaction.showModal(modal);
      return;
    }

    if (subcommand === '히스토리') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const { user, guild } = interaction;
      if (!guild) return;

      const history = await NicknameLog.findAll({
        where: { user_id: user.id, guild_id: guild.id },
        order: [['created_at', 'DESC']],
        limit: 10,
      });

      if (history.length === 0) {
        await interaction.editReply({ embeds: [warnEmbed('아직 닉네임을 변경한 기록이 없습니다.')] });
        return;
      }

      const list = history
        .map((h, i) => `${i + 1}. **${h.nickname}** — ${new Date(h.created_at).toLocaleString('ko-KR')}`)
        .join('\n');

      await interaction.editReply({ embeds: [infoEmbed(`${user.displayName}의 닉네임 히스토리`, list)] });
    }
  },
};
