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
exports.mbti = exports.MBTI_ROLE_PREFIXES = exports.findMbtiGroupRoles = void 0;
exports.syncMbtiGroupRole = syncMbtiGroupRole;
const discord_js_1 = require("discord.js");
const MbtiLog_1 = require("../database/models/MbtiLog");
const Role_1 = require("../database/models/Role");
Object.defineProperty(exports, "findMbtiGroupRoles", { enumerable: true, get: function () { return Role_1.findMbtiGroupRoles; } });
const Member_1 = require("../database/models/Member");
const mbti_1 = require("../constants/mbti");
Object.defineProperty(exports, "MBTI_ROLE_PREFIXES", { enumerable: true, get: function () { return mbti_1.MBTI_ROLE_PREFIXES; } });
const embed_1 = require("../utils/embed");
// Built once at module load — reused for every /mbti 설정 call
const SELECT_MENU_ROW = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
    .setCustomId(mbti_1.CUSTOM_IDS.MBTI_SELECT)
    .setPlaceholder('MBTI 유형을 선택하세요')
    .addOptions(mbti_1.MBTI_TYPES.map((type) => new discord_js_1.StringSelectMenuOptionBuilder().setLabel(type).setValue(type))));
function syncMbtiGroupRole(guild, prefix, dbRoles, discordRoles) {
    return __awaiter(this, void 0, void 0, function* () {
        const dbRole = dbRoles.find((r) => r.name.startsWith(prefix));
        const discordRole = discordRoles.find((r) => r.name.startsWith(prefix));
        const boostRole = discordRoles.find((r) => { var _a; return ((_a = r.tags) === null || _a === void 0 ? void 0 : _a.premiumSubscriberRole) === null; });
        const boostPosition = boostRole ? boostRole.position : 0;
        const color = embed_1.EMBED_COLORS[prefix];
        const roleOptions = {
            name: prefix,
            color,
            position: Math.max(1, boostPosition - 1),
        };
        if (dbRole && discordRole) {
            yield discordRole.edit({ color, position: Math.max(1, boostPosition - 1) });
            console.log(`[ROLE] Updated Discord role "${discordRole.name}" (${discordRole.id}) color and position in guild ${guild.id}`);
            return 'db';
        }
        if (dbRole && !discordRole) {
            yield dbRole.destroy();
            const newRole = yield guild.roles.create(roleOptions);
            yield (0, Role_1.registerRoleToDb)(newRole.id, guild.id, newRole.name);
            console.log(`[ROLE] Recreated Discord role "${newRole.name}" (${newRole.id}) and re-registered to DB in guild ${guild.id}`);
            return 'recreated';
        }
        if (!dbRole && discordRole) {
            yield (0, Role_1.registerRoleToDb)(discordRole.id, guild.id, discordRole.name);
            console.log(`[ROLE] Registered existing Discord role "${discordRole.name}" (${discordRole.id}) to DB in guild ${guild.id}`);
            return 'registered';
        }
        const newRole = yield guild.roles.create(roleOptions);
        yield (0, Role_1.registerRoleToDb)(newRole.id, guild.id, newRole.name);
        console.log(`[ROLE] Created Discord role "${newRole.name}" (${newRole.id}) in guild ${guild.id}`);
        return 'created';
    });
}
exports.mbti = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('mbti')
        .setDescription('MBTI 유형을 관리합니다.')
        .addSubcommand((sub) => sub.setName('설정').setDescription('나의 MBTI 유형을 선택합니다.'))
        .addSubcommand((sub) => sub.setName('커스텀').setDescription('서버 부스터 전용: 나만의 커스텀 MBTI 유형을 설정합니다.'))
        .addSubcommand((sub) => sub.setName('히스토리').setDescription('나의 MBTI 선택 히스토리를 조회합니다.'))
        .addSubcommand((sub) => sub.setName('서버통계').setDescription('서버의 MBTI 유형 분포를 조회합니다.')),
    handlesDeferral: true,
    execute: (_, interaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const { guild, user } = interaction;
        if (!guild)
            return;
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === '설정') {
            yield interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            yield interaction.editReply({ content: '아래에서 나의 MBTI 유형을 선택하세요:', components: [SELECT_MENU_ROW] });
            return;
        }
        if (subcommand === '커스텀') {
            const member = yield guild.members.fetch(user.id);
            if (!member.premiumSince) {
                yield interaction.reply({
                    embeds: [(0, embed_1.warnEmbed)('서버 부스터만 사용할 수 있는 기능입니다. 서버를 부스트하면 커스텀 MBTI를 설정할 수 있습니다!')],
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId(mbti_1.CUSTOM_IDS.CUSTOM_MBTI_MODAL)
                .setTitle('✨ 커스텀 MBTI 설정');
            const input = new discord_js_1.TextInputBuilder()
                .setCustomId(mbti_1.CUSTOM_IDS.CUSTOM_MBTI_INPUT)
                .setLabel('커스텀 MBTI 유형 (4글자 영문 대문자)')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setMinLength(4)
                .setMaxLength(4)
                .setPlaceholder('예: GISO, MONI, BOSS')
                .setRequired(true);
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(input));
            yield interaction.showModal(modal);
            return;
        }
        if (subcommand === '히스토리') {
            yield interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            const history = yield MbtiLog_1.MbtiLog.findAll({
                where: { user_id: user.id, guild_id: guild.id },
                order: [['created_at', 'DESC']],
                limit: 10,
            });
            if (history.length === 0) {
                yield interaction.editReply({ embeds: [(0, embed_1.warnEmbed)('아직 MBTI를 선택한 기록이 없습니다.')] });
                return;
            }
            const list = history
                .map((h, i) => `${i + 1}. **${h.mbti_type}** — ${new Date(h.created_at).toLocaleString('ko-KR')}`)
                .join('\n');
            const embed = (0, embed_1.infoEmbed)(`${user.displayName}의 MBTI 히스토리`, list);
            yield interaction.editReply({ embeds: [embed] });
            console.log(`[MBTI] History viewed by ${user.tag} (${user.id}) in guild ${guild.id}`);
            return;
        }
        if (subcommand === '서버통계') {
            yield interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            const users = yield Member_1.Member.findAll({ where: { guild_id: guild.id } });
            const total = users.length;
            if (total === 0) {
                yield interaction.editReply({ embeds: [(0, embed_1.warnEmbed)('등록된 유저가 없습니다.')] });
                return;
            }
            // MBTI 그룹별 카운트
            const groupCount = { IS: 0, IN: 0, ES: 0, EN: 0, NO: 0 };
            const typeCount = {};
            for (const u of users) {
                const type = u.mbti_type;
                const group = type === 'NONE' ? 'NO' : type.substring(0, 2);
                groupCount[group] = ((_a = groupCount[group]) !== null && _a !== void 0 ? _a : 0) + 1;
                typeCount[type] = ((_b = typeCount[type]) !== null && _b !== void 0 ? _b : 0) + 1;
            }
            const BAR_WIDTH = 20;
            const maxCount = Math.max(...mbti_1.MBTI_ROLE_PREFIXES.map((p) => { var _a; return (_a = groupCount[p]) !== null && _a !== void 0 ? _a : 0; }), 1);
            const groupLines = mbti_1.MBTI_ROLE_PREFIXES.map((prefix) => {
                var _a;
                const count = (_a = groupCount[prefix]) !== null && _a !== void 0 ? _a : 0;
                const pct = ((count / total) * 100).toFixed(1);
                const filled = Math.round((count / maxCount) * BAR_WIDTH);
                const bar = `\`${'█'.repeat(filled).padEnd(BAR_WIDTH, '░')}\``;
                return `${mbti_1.GROUP_EMOJIS[prefix]} **${prefix}** ${count}명 (${pct}%)\n${bar}`;
            });
            const sortedTypes = Object.entries(typeCount)
                .filter(([t]) => t !== 'NONE')
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([t, c]) => `**${t}** ${c}명`)
                .join(' · ');
            const noneCount = (_c = typeCount['NONE']) !== null && _c !== void 0 ? _c : 0;
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(embed_1.EMBED_COLORS.primary)
                .setTitle('서버 MBTI 분포')
                .setDescription(groupLines.join('\n'))
                .addFields({ name: '미설정', value: `${noneCount}명`, inline: true })
                .setFooter({ text: `총 ${total}명` });
            if (sortedTypes) {
                embed.addFields({ name: 'Top 5 유형', value: sortedTypes, inline: false });
            }
            yield interaction.editReply({ embeds: [embed] });
            console.log(`[MBTI] Server stats viewed by ${user.tag} (${user.id}) in guild ${guild.id}`);
        }
    }),
};
