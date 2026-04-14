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
const embed_1 = require("../utils/embed");
const Role_1 = require("../database/models/Role");
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
            const fetchedRoles = yield guild.roles.fetch();
            const toCreate = fetchedRoles
                .filter((r) => r.name !== '@everyone')
                .map((r) => ({ role_id: r.id, guild_id: guild.id, name: r.name }));
            const existingIds = new Set((yield Role_1.Role.findAll({ where: { role_id: toCreate.map((r) => r.role_id) }, attributes: ['role_id'] }))
                .map((r) => r.role_id));
            const newRoles = toCreate.filter((r) => !existingIds.has(r.role_id));
            if (newRoles.length > 0) {
                yield Role_1.Role.bulkCreate(newRoles, { ignoreDuplicates: true });
            }
            const registered = newRoles.length;
            const skipped = toCreate.length - registered;
            yield interaction.editReply({
                embeds: [(0, embed_1.successEmbed)(`역할 등록 완료!\n새로 등록: **${registered}개** | 이미 존재: **${skipped}개**`)],
            });
            console.log(`Guild ${guild.id}: roles registered=${registered}, skipped=${skipped}`);
            return;
        }
        if (subcommand === '목록') {
            const roles = yield Role_1.Role.findAll({ where: { guild_id: guild.id } });
            if (roles.length === 0) {
                yield interaction.editReply({ embeds: [(0, embed_1.infoEmbed)('등록된 역할 목록', '등록된 역할이 없습니다.')] });
                return;
            }
            const list = roles.map((r) => `• ${r.name} (\`${r.role_id}\`)`).join('\n');
            yield interaction.editReply({ embeds: [(0, embed_1.infoEmbed)('등록된 역할 목록', list)] });
            return;
        }
        if (subcommand === 'mbti그룹') {
            const [dbRoles, fetchedRoles] = yield Promise.all([(0, mbti_1.findMbtiGroupRoles)(guild.id), guild.roles.fetch()]);
            const discordRoles = fetchedRoles.filter((r) => r.name !== '@everyone');
            const results = { db: [], registered: [], created: [], recreated: [] };
            const syncResults = yield Promise.all(mbti_1.MBTI_ROLE_PREFIXES.map((prefix) => (0, mbti_1.syncMbtiGroupRole)(guild, prefix, dbRoles, discordRoles).then((status) => ({ prefix, status }))));
            for (const { prefix, status } of syncResults) {
                results[status].push(prefix);
            }
            (0, Role_1.invalidateMbtiRoleCache)(guild.id);
            const lines = [];
            if (results.db.length > 0)
                lines.push(`이미 DB 등록: **${results.db.join(', ')}**`);
            if (results.registered.length > 0)
                lines.push(`Discord 역할 DB 등록: **${results.registered.join(', ')}**`);
            if (results.created.length > 0)
                lines.push(`새로 생성: **${results.created.join(', ')}**`);
            if (results.recreated.length > 0)
                lines.push(`DB 삭제 후 재생성: **${results.recreated.join(', ')}**`);
            yield interaction.editReply({ embeds: [(0, embed_1.successEmbed)(`MBTI 그룹 역할 처리 완료!\n${lines.join('\n')}`)] });
            console.log(`Guild ${guild.id}: MBTI group roles — db=[${results.db.join(', ')}], registered=[${results.registered.join(', ')}], created=[${results.created.join(', ')}], recreated=[${results.recreated.join(', ')}]`);
        }
    }),
};
