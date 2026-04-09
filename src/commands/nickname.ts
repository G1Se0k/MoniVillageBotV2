import { ActionRowBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { SlashCommand } from '../types/slashCommand';
import { CUSTOM_IDS } from '../constants/mbti';
import { MV_NICKNAME } from '../database/models/MV_NICKNAME';

const COOLDOWN_DAYS = 7;

export const nickname: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('닉네임')
    .setDescription('닉네임을 관리합니다.')
    .addSubcommand((sub) => sub.setName('변경').setDescription('닉네임을 변경합니다.')),
  handlesDeferral: true,
  execute: async (_, interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '변경') {
      const { user, guild } = interaction;
      if (!guild) return;

      const lastChange = await MV_NICKNAME.findOne({
        where: { USER_ID: user.id, GUILD_ID: guild.id },
        order: [['CHANGED_AT', 'DESC']],
      });

      if (guild.ownerId === user.id) {
        await interaction.reply({ content: '⚠️ 서버 소유자는 봇이 닉네임을 변경할 수 없습니다.', ephemeral: true });
        return;
      }

      if (lastChange) {
        const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
        const elapsed = Date.now() - new Date(lastChange.CHANGED_AT).getTime();
        if (elapsed < cooldownMs) {
          const remaining = Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000));
          await interaction.reply({
            content: `닉네임 변경은 마지막 변경으로부터 **${COOLDOWN_DAYS}일** 후에 가능합니다.\n**${remaining}일** 후에 다시 시도해주세요.`,
            ephemeral: true,
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
    }
  },
};
