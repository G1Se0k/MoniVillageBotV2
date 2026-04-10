import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../types/slashCommand';
import { MV_ROLE, invalidateMbtiRoleCache } from '../database/models/MV_ROLE';
import { SyncStatus, syncMbtiGroupRole, findMbtiGroupRoles, MBTI_ROLE_PREFIXES, MbtiRolePrefix } from './mbti';

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

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '등록') {
      const fetchedRoles = await guild.roles.fetch();
      const toCreate = fetchedRoles
        .filter((r) => r.name !== '@everyone')
        .map((r) => ({ ROLE_ID: r.id, GUILD_ID: guild.id, ROLE_NAME: r.name }));

      const existingIds = new Set(
        (await MV_ROLE.findAll({ where: { ROLE_ID: toCreate.map((r) => r.ROLE_ID) }, attributes: ['ROLE_ID'] }))
          .map((r) => r.ROLE_ID),
      );

      const newRoles = toCreate.filter((r) => !existingIds.has(r.ROLE_ID));
      if (newRoles.length > 0) {
        await MV_ROLE.bulkCreate(newRoles, { ignoreDuplicates: true });
      }

      const registered = newRoles.length;
      const skipped = toCreate.length - registered;

      await interaction.editReply({
        content: `역할 등록 완료!\n새로 등록: **${registered}개** | 이미 존재: **${skipped}개**`,
      });
      console.log(`Guild ${guild.id}: roles registered=${registered}, skipped=${skipped}`);
      return;
    }

    if (subcommand === '목록') {
      const roles = await MV_ROLE.findAll({ where: { GUILD_ID: guild.id } });

      if (roles.length === 0) {
        await interaction.editReply({ content: '등록된 역할이 없습니다.' });
        return;
      }

      const list = roles.map((r) => `• ${r.ROLE_NAME} (\`${r.ROLE_ID}\`)`).join('\n');
      await interaction.editReply({ content: `**등록된 역할 목록**\n${list}` });
      return;
    }

    if (subcommand === 'mbti그룹') {
      const [dbRoles, fetchedRoles] = await Promise.all([findMbtiGroupRoles(guild.id), guild.roles.fetch()]);
      const discordRoles = fetchedRoles.filter((r) => r.name !== '@everyone');

      const results: Record<SyncStatus, string[]> = { db: [], registered: [], created: [], recreated: [] };

      const syncResults = await Promise.all(
        MBTI_ROLE_PREFIXES.map((prefix) =>
          syncMbtiGroupRole(guild, prefix as MbtiRolePrefix, dbRoles, discordRoles).then((status) => ({ prefix, status })),
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

      await interaction.editReply({ content: `MBTI 그룹 역할 처리 완료!\n${lines.join('\n')}` });
      console.log(
        `Guild ${guild.id}: MBTI group roles — db=[${results.db.join(', ')}], registered=[${results.registered.join(', ')}], created=[${results.created.join(', ')}], recreated=[${results.recreated.join(', ')}]`,
      );
    }
  },
};
