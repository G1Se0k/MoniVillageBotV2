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
exports.userRegister = void 0;
const discord_js_1 = require("discord.js");
const embed_1 = require("../utils/embed");
const Guild_1 = require("../database/models/Guild");
const Member_1 = require("../database/models/Member");
const mbti_1 = require("../constants/mbti");
const MBTI_TYPE_SET = new Set(mbti_1.MBTI_TYPES);
function extractMbtiFromNickname(nickname, displayName) {
    const source = nickname !== null && nickname !== void 0 ? nickname : displayName;
    const match = source.match(/\/([A-Z]{4})\s/);
    if (!match)
        return 'NONE';
    const type = match[1];
    return MBTI_TYPE_SET.has(type) ? type : 'NONE';
}
exports.userRegister = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('유저등록')
        .setDescription('서버의 모든 멤버를 DB에 일괄 등록합니다.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers),
    execute: (_, interaction) => __awaiter(void 0, void 0, void 0, function* () {
        const { guild } = interaction;
        if (!guild)
            return;
        yield interaction.editReply({ content: '서버 멤버 전체 등록 중...' });
        const [, guildCreated] = yield Guild_1.Guild.findOrCreate({ where: { id: guild.id } });
        if (guildCreated)
            console.log(`Guild registered: ${guild.id}`);
        const members = yield guild.members.fetch();
        const humanMembers = members.filter((m) => !m.user.bot);
        const existingIds = new Set((yield Member_1.Member.findAll({ where: { guild_id: guild.id }, attributes: ['user_id'] })).map((u) => u.user_id));
        const toCreate = humanMembers
            .filter((m) => !existingIds.has(m.id))
            .map((m) => ({
            user_id: m.id,
            guild_id: guild.id,
            mbti_type: extractMbtiFromNickname(m.nickname, m.displayName),
        }));
        if (toCreate.length > 0) {
            yield Member_1.Member.bulkCreate(toCreate, { ignoreDuplicates: true });
        }
        const registered = toCreate.length;
        const skipped = humanMembers.size - registered;
        yield interaction.editReply({
            embeds: [(0, embed_1.successEmbed)(`전체 멤버 등록 완료!\n새로 등록: **${registered}명** | 이미 존재: **${skipped}명**`)],
        });
        console.log(`Guild ${guild.id}: bulk user register — new=${registered}, skipped=${skipped}`);
    }),
};
