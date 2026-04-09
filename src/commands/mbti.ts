import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  Collection,
  Guild,
  Role,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { SlashCommand } from '../types/slashCommand';
import { MV_MBTI } from '../database/models/MV_MBTI';
import { MV_ROLE, findMbtiGroupRoles, registerRoleToDb } from '../database/models/MV_ROLE';
import { MBTI_TYPES, MBTI_ROLE_PREFIXES, MbtiRolePrefix, CUSTOM_IDS } from '../constants/mbti';

// Built once at module load — reused for every /mbti 설정 call
const SELECT_MENU_ROW = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId(CUSTOM_IDS.MBTI_SELECT)
    .setPlaceholder('MBTI 유형을 선택하세요')
    .addOptions(MBTI_TYPES.map((type) => new StringSelectMenuOptionBuilder().setLabel(type).setValue(type))),
);

const MBTI_GROUP_COLORS: Record<MbtiRolePrefix, number> = {
  IS: 0x1f8b4c, // lime
  IN: 0x3498db, // skyblue
  EN: 0xe67e22, // orange
  ES: 0xe91e63, // red
  NO: 0x546e7a, // black
};

export type SyncStatus = 'db' | 'registered' | 'created' | 'recreated';

export async function syncMbtiGroupRole(
  guild: Guild,
  prefix: MbtiRolePrefix,
  dbRoles: MV_ROLE[],
  discordRoles: Collection<string, Role>,
): Promise<SyncStatus> {
  const dbRole = dbRoles.find((r) => r.ROLE_NAME.startsWith(prefix));
  const discordRole = discordRoles.find((r) => r.name.startsWith(prefix));

  const boostRole = discordRoles.find((r) => r.tags?.premiumSubscriberRole === null);
  const boostPosition = boostRole ? boostRole.position : 0;
  const color = MBTI_GROUP_COLORS[prefix];
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
    .addSubcommand((sub) => sub.setName('히스토리').setDescription('나의 MBTI 선택 히스토리를 조회합니다.')),
  handlesDeferral: true,
  execute: async (_, interaction: ChatInputCommandInteraction) => {
    const { guild, user } = interaction;
    if (!guild) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '설정') {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ content: '아래에서 나의 MBTI 유형을 선택하세요:', components: [SELECT_MENU_ROW] });
      return;
    }

    if (subcommand === '히스토리') {
      await interaction.deferReply({ ephemeral: true });

      const history = await MV_MBTI.findAll({
        where: { USER_ID: user.id, GUILD_ID: guild.id },
        order: [['SELECTED_AT', 'DESC']],
        limit: 10,
      });

      console.log(`[MBTI] History viewed by ${user.tag} (${user.id}) in guild ${guild.id}:`);

      if (history.length === 0) {
        console.log('  (no history)');
        await interaction.editReply({ content: '아직 MBTI를 선택한 기록이 없습니다.' });
        return;
      }

      history.forEach((h, i) => {
        console.log(`  ${i + 1}. ${h.MBTI_TYPE} - ${new Date(h.SELECTED_AT).toLocaleString('ko-KR')}`);
      });

      const list = history
        .map((h, i) => `${i + 1}. **${h.MBTI_TYPE}** — ${new Date(h.SELECTED_AT).toLocaleString('ko-KR')}`)
        .join('\n');

      await interaction.editReply({ content: `**${user.displayName}의 MBTI 히스토리**\n${list}` });
    }
  },
};
