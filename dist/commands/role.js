"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.role = void 0;
const discord_js_1 = require("discord.js");
const MV_GUILD_1 = require("../database/models/MV_GUILD");
const MV_ROLE_1 = require("../database/models/MV_ROLE");
const mbti_1 = require("./mbti");
exports.role = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('role')
        .setDescription('서버의 역할을 관리합니다.')
        .addSubcommand((sub) => sub.setName('등록').setDescription('현재 서버의 모든 역할을 DB에 등록합니다.'))
        .addSubcommand((sub) => sub.setName('목록').setDescription('DB에 등록된 역할 목록을 조회합니다.'))
        .addSubcommand((sub) => sub.setName('mbti그룹').setDescription(`MBTI 그룹 역할(${mbti_1.MBTI_ROLE_PREFIXES.join(', ')})을 조회하거나 없으면 생성합니다.`))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    execute: (_, interaction) => __awaiter(void 0, void 0, void 0, function* () {
        const { guild } = interaction;
        if (!guild)
            return;
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === '등록') {
            yield MV_GUILD_1.MV_GUILD.findOrCreate({ where: { GUILD_ID: guild.id } });
            const fetchedRoles = yield guild.roles.fetch();
            const guildRoles = fetchedRoles.filter((r) => r.name !== '@everyone');
            let registered = 0;
            let skipped = 0;
            const failed = [];
            for (const [, guildRole] of guildRoles) {
                try {
                    const [, created] = yield MV_ROLE_1.MV_ROLE.findOrCreate({
                        where: { ROLE_ID: guildRole.id },
                        defaults: { ROLE_ID: guildRole.id, GUILD_ID: guild.id, ROLE_NAME: guildRole.name },
                    });
                    created ? registered++ : skipped++;
                }
                catch (err) {
                    console.error(`역할 등록 실패 [${guildRole.name}]:`, err);
                    failed.push(guildRole.name);
                }
            }
            const failedMsg = failed.length > 0 ? `\n실패: **${failed.length}개** (${failed.join(', ')})` : '';
            yield interaction.editReply({
                content: `역할 등록 완료!\n새로 등록: **${registered}개** | 이미 존재: **${skipped}개**${failedMsg}`,
            });
            console.log(`Guild ${guild.id}: roles registered=${registered}, skipped=${skipped}, failed=${failed.length}`);
            return;
        }
        if (subcommand === '목록') {
            const roles = yield MV_ROLE_1.MV_ROLE.findAll({ where: { GUILD_ID: guild.id } });
            if (roles.length === 0) {
                yield interaction.editReply({ content: '등록된 역할이 없습니다.' });
                return;
            }
            const list = roles.map((r) => `• ${r.ROLE_NAME} (\`${r.ROLE_ID}\`)`).join('\n');
            yield interaction.editReply({ content: `**등록된 역할 목록**\n${list}` });
            return;
        }
        if (subcommand === 'mbti그룹') {
            yield MV_GUILD_1.MV_GUILD.findOrCreate({ where: { GUILD_ID: guild.id } });
            const [dbRoles, fetchedRoles] = yield Promise.all([(0, mbti_1.findMbtiGroupRoles)(guild.id), guild.roles.fetch()]);
            const discordRoles = fetchedRoles.filter((r) => r.name !== '@everyone');
            const results = { db: [], registered: [], created: [], recreated: [] };
            for (const prefix of mbti_1.MBTI_ROLE_PREFIXES) {
                const status = yield (0, mbti_1.syncMbtiGroupRole)(guild, prefix, dbRoles, discordRoles);
                results[status].push(prefix);
            }
            const lines = [];
            if (results.db.length > 0)
                lines.push(`이미 DB 등록: **${results.db.join(', ')}**`);
            if (results.registered.length > 0)
                lines.push(`Discord 역할 DB 등록: **${results.registered.join(', ')}**`);
            if (results.created.length > 0)
                lines.push(`새로 생성: **${results.created.join(', ')}**`);
            if (results.recreated.length > 0)
                lines.push(`DB 삭제 후 재생성: **${results.recreated.join(', ')}**`);
            yield interaction.editReply({ content: `MBTI 그룹 역할 처리 완료!\n${lines.join('\n')}` });
            console.log(`Guild ${guild.id}: MBTI group roles — db=[${results.db.join(', ')}], registered=[${results.registered.join(', ')}], created=[${results.created.join(', ')}], recreated=[${results.recreated.join(', ')}]`);
        }
    }),
};
