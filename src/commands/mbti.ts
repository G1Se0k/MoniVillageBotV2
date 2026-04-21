import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  Collection,
  EmbedBuilder,
  Guild,
  MessageFlags,
  ModalBuilder,
  Role,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { SlashCommand } from '../types/slashCommand';
import { MbtiLog } from '../database/models/MbtiLog';
import { Role as DbRole, findMbtiGroupRoles, registerRoleToDb } from '../database/models/Role';
import { Member } from '../database/models/Member';
import { MBTI_TYPES, MBTI_ROLE_PREFIXES, MbtiRolePrefix, CUSTOM_IDS, GROUP_EMOJIS } from '../constants/mbti';
import { infoEmbed, warnEmbed, EMBED_COLORS } from '../utils/embed';

// Built once at module load — reused for every /mbti 설정 call
const SELECT_MENU_ROW = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId(CUSTOM_IDS.MBTI_SELECT)
    .setPlaceholder('MBTI 유형을 선택하세요')
    .addOptions(MBTI_TYPES.map((type) => new StringSelectMenuOptionBuilder().setLabel(type).setValue(type))),
);

export type SyncStatus = 'db' | 'registered' | 'created' | 'recreated';

export async function syncMbtiGroupRole(
  guild: Guild,
  prefix: MbtiRolePrefix,
  dbRoles: DbRole[],
  discordRoles: Collection<string, Role>,
): Promise<SyncStatus> {
  const dbRole = dbRoles.find((r) => r.name.startsWith(prefix));
  const discordRole = discordRoles.find((r) => r.name.startsWith(prefix));

  const boostRole = discordRoles.find((r) => r.tags?.premiumSubscriberRole === null);
  const boostPosition = boostRole ? boostRole.position : 0;
  const color = EMBED_COLORS[prefix];
  const roleOptions = {
    name: prefix,
    color,
    position: Math.max(1, boostPosition - 1),
  };

  if (dbRole && discordRole) {
    await discordRole.edit({ color, position: Math.max(1, boostPosition - 1) });
    console.log(`[ROLE] Updated Discord role "${discordRole.name}" (${discordRole.id}) color and position in guild ${guild.id}`);
    return 'db';
  }

  if (dbRole && !discordRole) {
    await dbRole.destroy();
    const newRole = await guild.roles.create(roleOptions);
    await registerRoleToDb(newRole.id, guild.id, newRole.name);
    console.log(`[ROLE] Recreated Discord role "${newRole.name}" (${newRole.id}) and re-registered to DB in guild ${guild.id}`);
    return 'recreated';
  }

  if (!dbRole && discordRole) {
    await registerRoleToDb(discordRole.id, guild.id, discordRole.name);
    console.log(`[ROLE] Registered existing Discord role "${discordRole.name}" (${discordRole.id}) to DB in guild ${guild.id}`);
    return 'registered';
  }

  const newRole = await guild.roles.create(roleOptions);
  await registerRoleToDb(newRole.id, guild.id, newRole.name);
  console.log(`[ROLE] Created Discord role "${newRole.name}" (${newRole.id}) in guild ${guild.id}`);
  return 'created';
}

export { findMbtiGroupRoles, MBTI_ROLE_PREFIXES };
export type { MbtiRolePrefix };

export const mbti: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('mbti')
    .setDescription('MBTI 유형을 관리합니다.')
    .addSubcommand((sub) => sub.setName('설정').setDescription('나의 MBTI 유형을 선택합니다.'))
    .addSubcommand((sub) => sub.setName('커스텀').setDescription('서버 부스터 전용: 나만의 커스텀 MBTI 유형을 설정합니다.'))
    .addSubcommand((sub) => sub.setName('히스토리').setDescription('나의 MBTI 선택 히스토리를 조회합니다.'))
    .addSubcommand((sub) => sub.setName('서버통계').setDescription('서버의 MBTI 유형 분포를 조회합니다.')),
  handlesDeferral: true,
  execute: async (_, interaction: ChatInputCommandInteraction) => {
    const { guild, user } = interaction;
    if (!guild) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '설정') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply({ content: '아래에서 나의 MBTI 유형을 선택하세요:', components: [SELECT_MENU_ROW] });
      return;
    }

    if (subcommand === '커스텀') {
      const member = await guild.members.fetch(user.id);
      if (!member.premiumSince) {
        await interaction.reply({
          embeds: [warnEmbed('서버 부스터만 사용할 수 있는 기능입니다. 서버를 부스트하면 커스텀 MBTI를 설정할 수 있습니다!')],
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

    if (subcommand === '히스토리') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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

      const embed = infoEmbed(`${user.displayName}의 MBTI 히스토리`, list);
      await interaction.editReply({ embeds: [embed] });
      console.log(`[MBTI] History viewed by ${user.tag} (${user.id}) in guild ${guild.id}`);
      return;
    }

    if (subcommand === '서버통계') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const users = await Member.findAll({ where: { guild_id: guild.id } });

      const total = users.length;
      if (total === 0) {
        await interaction.editReply({ embeds: [warnEmbed('등록된 유저가 없습니다.')] });
        return;
      }

      // MBTI 그룹별 카운트
      const groupCount: Record<string, number> = { IS: 0, IN: 0, ES: 0, EN: 0, NO: 0 };
      const typeCount: Record<string, number> = {};

      for (const u of users) {
        const type = u.mbti_type;
        const group = type === 'NONE' ? 'NO' : type.substring(0, 2);
        groupCount[group] = (groupCount[group] ?? 0) + 1;
        typeCount[type] = (typeCount[type] ?? 0) + 1;
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
        .filter(([t]) => t !== 'NONE')
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([t, c]) => `**${t}** ${c}명`)
        .join(' · ');

      const noneCount = typeCount['NONE'] ?? 0;

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.primary)
        .setTitle('서버 MBTI 분포')
        .setDescription(groupLines.join('\n'))
        .addFields({ name: '미설정', value: `${noneCount}명`, inline: true })
        .setFooter({ text: `총 ${total}명` });

      if (sortedTypes) {
        embed.addFields({ name: 'Top 5 유형', value: sortedTypes, inline: false });
      }

      await interaction.editReply({ embeds: [embed] });
      console.log(`[MBTI] Server stats viewed by ${user.tag} (${user.id}) in guild ${guild.id}`);
    }
  },
};
