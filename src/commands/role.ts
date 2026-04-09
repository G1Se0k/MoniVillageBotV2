import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../types/slashCommand';
import { MV_GUILD } from '../database/models/MV_GUILD';
import { MV_ROLE } from '../database/models/MV_ROLE';
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
      await MV_GUILD.findOrCreate({ where: { GUILD_ID: guild.id } });

      const fetchedRoles = await guild.roles.fetch();
      const guildRoles = fetchedRoles.filter((r) => r.name !== '@everyone');

      let registered = 0;
      let skipped = 0;
      const failed: string[] = [];

      for (const [, guildRole] of guildRoles) {
        try {
          const [, created] = await MV_ROLE.findOrCreate({
            where: { ROLE_ID: guildRole.id },
            defaults: { ROLE_ID: guildRole.id, GUILD_ID: guild.id, ROLE_NAME: guildRole.name },
          });
          created ? registered++ : skipped++;
        } catch (err) {
          console.error(`역할 등록 실패 [${guildRole.name}]:`, err);
          failed.push(guildRole.name);
        }
      }

      const failedMsg = failed.length > 0 ? `\n실패: **${failed.length}개** (${failed.join(', ')})` : '';
      await interaction.editReply({
        content: `역할 등록 완료!\n새로 등록: **${registered}개** | 이미 존재: **${skipped}개**${failedMsg}`,
      });
      console.log(`Guild ${guild.id}: roles registered=${registered}, skipped=${skipped}, failed=${failed.length}`);
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
      await MV_GUILD.findOrCreate({ where: { GUILD_ID: guild.id } });

      const [dbRoles, fetchedRoles] = await Promise.all([findMbtiGroupRoles(guild.id), guild.roles.fetch()]);
      const discordRoles = fetchedRoles.filter((r) => r.name !== '@everyone');

      const results: Record<SyncStatus, string[]> = { db: [], registered: [], created: [], recreated: [] };

      for (const prefix of MBTI_ROLE_PREFIXES) {
        const status = await syncMbtiGroupRole(guild, prefix as MbtiRolePrefix, dbRoles, discordRoles);
        results[status].push(prefix);
      }

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
