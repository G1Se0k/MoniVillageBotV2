import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { SlashCommand } from '../types/slashCommand';
import {
  MbtiLog,
  Member,
  MBTI_TYPES,
  MBTI_TYPE_SET,
  MBTI_ROLE_PREFIXES,
  CUSTOM_IDS,
  GROUP_EMOJIS,
  Item,
  UserItem,
} from '@moni/shared';
import { infoEmbed, warnEmbed, EMBED_COLORS } from '../utils/embed';
import { handleCustomMbtiReset } from '../interactions/customMbtiModalHandler';
import { mbtiTypeToPrefix } from '../interactions/mbtiUtils';

// Built once at module load — reused for every /mbti 설정 call
const SELECT_MENU_ROW = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId(CUSTOM_IDS.MBTI_SELECT)
    .setPlaceholder('MBTI 유형을 선택하세요')
    .addOptions(MBTI_TYPES.map((type) => new StringSelectMenuOptionBuilder().setLabel(type).setValue(type))),
);

export const mbti: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mbti')
    .setDescription('MBTI 유형을 관리합니다.')
    .addSubcommand((sub) => sub.setName('설정').setDescription('나의 MBTI 유형을 선택합니다.'))
    .addSubcommand((sub) => sub.setName('커스텀').setDescription('서버 부스터 전용: 나만의 커스텀 MBTI 유형을 설정합니다.'))
    .addSubcommand((sub) => sub.setName('커스텀초기화').setDescription('커스텀 MBTI를 초기화하고 이전 표준 MBTI로 되돌립니다.'))
    .addSubcommand((sub) => sub.setName('히스토리').setDescription('나의 MBTI 선택 히스토리를 조회합니다.'))
    .addSubcommand((sub) => sub.setName('서버통계').setDescription('서버의 MBTI 유형 분포를 조회합니다.')),
  execute: async (_, interaction: ChatInputCommandInteraction) => {
    const { guild, user } = interaction;
    if (!guild) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '설정') {
      await interaction.reply({
        content: '아래에서 나의 MBTI 유형을 선택하세요:',
        components: [SELECT_MENU_ROW],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (subcommand === '커스텀') {
      const item = await Item.findOne({ where: { code: 'custom_mbti', active: true } });
      const owned = item && await UserItem.findOne({ where: { user_id: user.id, item_id: item.id } });
      if (!owned) {
        await interaction.reply({
          embeds: [warnEmbed('커스텀 MBTI 이용권을 보유해야 사용할 수 있습니다. 상점에서 구매해주세요.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const modal = new ModalBuilder()
        .setCustomId(CUSTOM_IDS.CUSTOM_MBTI_MODAL)
        .setTitle('✨ 커스텀 MBTI 설정');

      const input = new TextInputBuilder()
        .setCustomId(CUSTOM_IDS.CUSTOM_MBTI_INPUT)
        .setLabel('커스텀 MBTI 유형 (4글자 영문 대문자)')
        .setStyle(TextInputStyle.Short)
        .setMinLength(4)
        .setMaxLength(4)
        .setPlaceholder('예: GISO, MONI, BOSS')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      await interaction.showModal(modal);
      return;
    }

    if (subcommand === '커스텀초기화') {
      await handleCustomMbtiReset(interaction);
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (subcommand === '히스토리') {
      const history = await MbtiLog.findAll({
        where: { user_id: user.id, guild_id: guild.id },
        order: [['created_at', 'DESC']],
        limit: 10,
      });

      if (history.length === 0) {
        await interaction.editReply({ embeds: [warnEmbed('아직 MBTI를 선택한 기록이 없습니다.')] });
        return;
      }

      const list = history
        .map((h, i) => `${i + 1}. **${h.mbti_type}** — ${new Date(h.created_at).toLocaleString('ko-KR')}`)
        .join('\n');

      await interaction.editReply({ embeds: [infoEmbed(`${user.displayName}의 MBTI 히스토리`, list)] });
      console.log(`[MBTI] History viewed by ${user.tag} (${user.id}) in guild ${guild.id}`);
      return;
    }

    if (subcommand === '서버통계') {
      const users = await Member.findAll({ where: { guild_id: guild.id } });

      const total = users.length;
      if (total === 0) {
        await interaction.editReply({ embeds: [warnEmbed('등록된 유저가 없습니다.')] });
        return;
      }

      const groupCount: Record<string, number> = { IS: 0, IN: 0, ES: 0, EN: 0, NO: 0 };
      const typeCount: Record<string, number> = {};
      let customCount = 0;

      for (const u of users) {
        const type = u.mbti_type;
        typeCount[type] = (typeCount[type] ?? 0) + 1;
        if (!MBTI_TYPE_SET.has(type)) {
          customCount++;
        } else {
          groupCount[mbtiTypeToPrefix(type)] += 1;
        }
      }

      const BAR_WIDTH = 20;
      const maxCount = Math.max(...MBTI_ROLE_PREFIXES.map((p) => groupCount[p] ?? 0), 1);

      const groupLines = MBTI_ROLE_PREFIXES.map((prefix) => {
        const count = groupCount[prefix] ?? 0;
        const pct = ((count / total) * 100).toFixed(1);
        const filled = Math.round((count / maxCount) * BAR_WIDTH);
        const bar = `\`${'█'.repeat(filled).padEnd(BAR_WIDTH, '░')}\``;
        return `${GROUP_EMOJIS[prefix]} **${prefix}** ${count}명 (${pct}%)\n${bar}`;
      });

      const sortedTypes = Object.entries(typeCount)
        .filter(([t]) => t !== 'NONE' && MBTI_TYPE_SET.has(t))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([t, c]) => `**${t}** ${c}명`)
        .join(' · ');

      const noneCount = typeCount['NONE'] ?? 0;

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.primary)
        .setTitle('서버 MBTI 분포')
        .setDescription(groupLines.join('\n'))
        .addFields(
          { name: '미설정', value: `${noneCount}명`, inline: true },
          { name: '커스텀', value: `${customCount}명`, inline: true },
        )
        .setFooter({ text: `총 ${total}명` });

      if (sortedTypes) {
        embed.addFields({ name: 'Top 5 유형', value: sortedTypes, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
      console.log(`[MBTI] Server stats viewed by ${user.tag} (${user.id}) in guild ${guild.id}`);
    }
  },
};