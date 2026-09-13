import {
  Collection,
  Guild,
  MessageFlags,
  PermissionFlagsBits,
  Role as DiscordRole,
  SlashCommandBuilder,
} from 'discord.js';
import { infoEmbed, successEmbed, EMBED_COLORS } from '../utils/embed';
import { SlashCommand } from '../types/slashCommand';
import {
  Role,
  findMbtiGroupRoles,
  invalidateMbtiRoleCache,
  registerRoleToDb,
} from '../database/models/Role';
import { MBTI_ROLE_PREFIXES, MbtiRolePrefix } from '../constants/mbti';

type SyncStatus = 'db' | 'registered' | 'created' | 'recreated';

async function syncMbtiGroupRole(
  guild: Guild,
  prefix: MbtiRolePrefix,
  dbRoles: Role[],
  discordRoles: Collection<string, DiscordRole>,
): Promise<SyncStatus> {
  const dbRole = dbRoles.find((r) => r.name.startsWith(prefix));
  const discordRole = discordRoles.find((r) => r.name.startsWith(prefix));

  const boostRole = discordRoles.find((r) => r.tags?.premiumSubscriberRole === null);
  const boostPosition = boostRole ? boostRole.position : 0;
  const color = EMBED_COLORS[prefix];
  const position = Math.max(1, boostPosition - 1);

  if (dbRole && discordRole) {
    await discordRole.edit({ color, position });
    console.log(`[ROLE] Updated Discord role "${discordRole.name}" (${discordRole.id}) color and position in guild ${guild.id}`);
    return 'db';
  }

  if (dbRole && !discordRole) {
    await dbRole.destroy();
    const newRole = await guild.roles.create({ name: prefix, color, position });
    await registerRoleToDb(newRole.id, guild.id, newRole.name);
    console.log(`[ROLE] Recreated Discord role "${newRole.name}" (${newRole.id}) and re-registered to DB in guild ${guild.id}`);
    return 'recreated';
  }

  if (!dbRole && discordRole) {
    await registerRoleToDb(discordRole.id, guild.id, discordRole.name);
    console.log(`[ROLE] Registered existing Discord role "${discordRole.name}" (${discordRole.id}) to DB in guild ${guild.id}`);
    return 'registered';
  }

  const newRole = await guild.roles.create({ name: prefix, color, position });
  await registerRoleToDb(newRole.id, guild.id, newRole.name);
  console.log(`[ROLE] Created Discord role "${newRole.name}" (${newRole.id}) in guild ${guild.id}`);
  return 'created';
}

export const role: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('서버의 역할을 관리합니다.')
    .addSubcommand((sub) => sub.setName('등록').setDescription('현재 서버의 모든 역할을 DB에 등록합니다.'))
    .addSubcommand((sub) => sub.setName('목록').setDescription('DB에 등록된 역할 목록을 조회합니다.'))
    .addSubcommand((sub) =>
      sub.setName('mbti그룹').setDescription(`MBTI 그룹 역할(${MBTI_ROLE_PREFIXES.join(', ')})을 조회하거나 없으면 생성합니다.`),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  execute: async (_, interaction) => {
    const { guild } = interaction;
    if (!guild) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '등록') {
      const fetchedRoles = await guild.roles.fetch();
      const toCreate = fetchedRoles
        .filter((r) => r.name !== '@everyone')
        .map((r) => ({ role_id: r.id, guild_id: guild.id, name: r.name }));

      const existingIds = new Set(
        (await Role.findAll({ where: { role_id: toCreate.map((r) => r.role_id) }, attributes: ['role_id'] }))
          .map((r) => r.role_id),
      );

      const newRoles = toCreate.filter((r) => !existingIds.has(r.role_id));
      if (newRoles.length > 0) {
        await Role.bulkCreate(newRoles, { ignoreDuplicates: true });
      }

      const registered = newRoles.length;
      const skipped = toCreate.length - registered;

      await interaction.editReply({
        embeds: [successEmbed(`역할 등록 완료!\n새로 등록: **${registered}개** | 이미 존재: **${skipped}개**`)],
      });
      console.log(`Guild ${guild.id}: roles registered=${registered}, skipped=${skipped}`);
      return;
    }

    if (subcommand === '목록') {
      const roles = await Role.findAll({ where: { guild_id: guild.id } });

      if (roles.length === 0) {
        await interaction.editReply({ embeds: [infoEmbed('등록된 역할 목록', '등록된 역할이 없습니다.')] });
        return;
      }

      const list = roles.map((r) => `• ${r.name} (\`${r.role_id}\`)`).join('\n');
      await interaction.editReply({ embeds: [infoEmbed('등록된 역할 목록', list)] });
      return;
    }

    if (subcommand === 'mbti그룹') {
      const [dbRoles, fetchedRoles] = await Promise.all([findMbtiGroupRoles(guild.id), guild.roles.fetch()]);
      const discordRoles = fetchedRoles.filter((r) => r.name !== '@everyone');

      const results: Record<SyncStatus, string[]> = { db: [], registered: [], created: [], recreated: [] };

      const syncResults = await Promise.all(
        MBTI_ROLE_PREFIXES.map((prefix) =>
          syncMbtiGroupRole(guild, prefix, dbRoles, discordRoles).then((status) => ({ prefix, status })),
        ),
      );
      for (const { prefix, status } of syncResults) {
        results[status].push(prefix);
      }

      invalidateMbtiRoleCache(guild.id);

      const lines: string[] = [];
      if (results.db.length > 0) lines.push(`이미 DB 등록: **${results.db.join(', ')}**`);
      if (results.registered.length > 0) lines.push(`Discord 역할 DB 등록: **${results.registered.join(', ')}**`);
      if (results.created.length > 0) lines.push(`새로 생성: **${results.created.join(', ')}**`);
      if (results.recreated.length > 0) lines.push(`DB 삭제 후 재생성: **${results.recreated.join(', ')}**`);

      await interaction.editReply({ embeds: [successEmbed(`MBTI 그룹 역할 처리 완료!\n${lines.join('\n')}`)] });
      console.log(
        `Guild ${guild.id}: MBTI group roles — db=[${results.db.join(', ')}], registered=[${results.registered.join(', ')}], created=[${results.created.join(', ')}], recreated=[${results.recreated.join(', ')}]`,
      );
    }
  },
};