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
const MV_MBTI_1 = require("../database/models/MV_MBTI");
const MV_ROLE_1 = require("../database/models/MV_ROLE");
Object.defineProperty(exports, "findMbtiGroupRoles", { enumerable: true, get: function () { return MV_ROLE_1.findMbtiGroupRoles; } });
const mbti_1 = require("../constants/mbti");
Object.defineProperty(exports, "MBTI_ROLE_PREFIXES", { enumerable: true, get: function () { return mbti_1.MBTI_ROLE_PREFIXES; } });
// Built once at module load — reused for every /mbti 설정 call
const SELECT_MENU_ROW = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
    .setCustomId(mbti_1.CUSTOM_IDS.MBTI_SELECT)
    .setPlaceholder('MBTI 유형을 선택하세요')
    .addOptions(mbti_1.MBTI_TYPES.map((type) => new discord_js_1.StringSelectMenuOptionBuilder().setLabel(type).setValue(type))));
const MBTI_GROUP_COLORS = {
    IS: 0x1f8b4c, // lime
    IN: 0x3498db, // skyblue
    EN: 0xe67e22, // orange
    ES: 0xe91e63, // red
    NO: 0x546e7a, // black
};
function syncMbtiGroupRole(guild, prefix, dbRoles, discordRoles) {
    return __awaiter(this, void 0, void 0, function* () {
        const dbRole = dbRoles.find((r) => r.ROLE_NAME.startsWith(prefix));
        const discordRole = discordRoles.find((r) => r.name.startsWith(prefix));
        const boostRole = discordRoles.find((r) => { var _a; return ((_a = r.tags) === null || _a === void 0 ? void 0 : _a.premiumSubscriberRole) === null; });
        const boostPosition = boostRole ? boostRole.position : 0;
        const color = MBTI_GROUP_COLORS[prefix];
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
            yield (0, MV_ROLE_1.registerRoleToDb)(newRole.id, guild.id, newRole.name);
            console.log(`[ROLE] Recreated Discord role "${newRole.name}" (${newRole.id}) and re-registered to DB in guild ${guild.id}`);
            return 'recreated';
        }
        if (!dbRole && discordRole) {
            yield (0, MV_ROLE_1.registerRoleToDb)(discordRole.id, guild.id, discordRole.name);
            console.log(`[ROLE] Registered existing Discord role "${discordRole.name}" (${discordRole.id}) to DB in guild ${guild.id}`);
            return 'registered';
        }
        const newRole = yield guild.roles.create(roleOptions);
        yield (0, MV_ROLE_1.registerRoleToDb)(newRole.id, guild.id, newRole.name);
        console.log(`[ROLE] Created Discord role "${newRole.name}" (${newRole.id}) in guild ${guild.id}`);
        return 'created';
    });
}
exports.mbti = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('mbti')
        .setDescription('MBTI 유형을 관리합니다.')
        .addSubcommand((sub) => sub.setName('설정').setDescription('나의 MBTI 유형을 선택합니다.'))
        .addSubcommand((sub) => sub.setName('히스토리').setDescription('나의 MBTI 선택 히스토리를 조회합니다.')),
    handlesDeferral: true,
    execute: (_, interaction) => __awaiter(void 0, void 0, void 0, function* () {
        const { guild, user } = interaction;
        if (!guild)
            return;
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === '설정') {
            yield interaction.deferReply({ ephemeral: true });
            yield interaction.editReply({ content: '아래에서 나의 MBTI 유형을 선택하세요:', components: [SELECT_MENU_ROW] });
            return;
        }
        if (subcommand === '히스토리') {
            yield interaction.deferReply({ ephemeral: true });
            const history = yield MV_MBTI_1.MV_MBTI.findAll({
                where: { USER_ID: user.id, GUILD_ID: guild.id },
                order: [['SELECTED_AT', 'DESC']],
                limit: 10,
            });
            console.log(`[MBTI] History viewed by ${user.tag} (${user.id}) in guild ${guild.id}:`);
            if (history.length === 0) {
                console.log('  (no history)');
                yield interaction.editReply({ content: '아직 MBTI를 선택한 기록이 없습니다.' });
                return;
            }
            history.forEach((h, i) => {
                console.log(`  ${i + 1}. ${h.MBTI_TYPE} - ${new Date(h.SELECTED_AT).toLocaleString('ko-KR')}`);
            });
            const list = history
                .map((h, i) => `${i + 1}. **${h.MBTI_TYPE}** — ${new Date(h.SELECTED_AT).toLocaleString('ko-KR')}`)
                .join('\n');
            yield interaction.editReply({ content: `**${user.displayName}의 MBTI 히스토리**\n${list}` });
        }
    }),
};
