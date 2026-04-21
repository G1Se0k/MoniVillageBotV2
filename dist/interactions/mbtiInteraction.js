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
exports.resolveNewNickname = exports.resolveDisplayType = void 0;
exports.handleMbtiSelect = handleMbtiSelect;
const discord_js_1 = require("discord.js");
const embed_1 = require("../utils/embed");
const MbtiLog_1 = require("../database/models/MbtiLog");
const Member_1 = require("../database/models/Member");
const Role_1 = require("../database/models/Role");
const mbtiUtils_1 = require("./mbtiUtils");
Object.defineProperty(exports, "resolveDisplayType", { enumerable: true, get: function () { return mbtiUtils_1.resolveDisplayType; } });
Object.defineProperty(exports, "resolveNewNickname", { enumerable: true, get: function () { return mbtiUtils_1.resolveNewNickname; } });
function handleMbtiSelect(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { guild, user } = interaction;
        if (!guild)
            return;
        const selectedType = interaction.values[0];
        // 읽기 단계: 쓰기 없이 필요한 데이터를 모두 병렬로 조회
        const [mbtiGroupRoles, existingRecord, member] = yield Promise.all([
            (0, Role_1.findMbtiGroupRoles)(guild.id),
            Member_1.Member.findOne({ where: { user_id: user.id, guild_id: guild.id } }),
            guild.members.fetch(user.id),
        ]);
        if ((existingRecord === null || existingRecord === void 0 ? void 0 : existingRecord.mbti_type) === selectedType) {
            yield interaction.update({
                embeds: [new discord_js_1.EmbedBuilder().setColor(embed_1.EMBED_COLORS.warning).setDescription(`이미 **${selectedType}**(으)로 선택되어 있습니다.`)],
                components: [],
            });
            return;
        }
        // 쓰기 단계: 중복 체크 통과 후에만 DB에 반영
        yield Promise.all([
            MbtiLog_1.MbtiLog.create({ user_id: user.id, guild_id: guild.id, mbti_type: selectedType }),
            Member_1.Member.upsert({ user_id: user.id, guild_id: guild.id, mbti_type: selectedType }),
        ]);
        const prefix = (0, mbtiUtils_1.mbtiTypeToPrefix)(selectedType);
        const groupColor = (_a = embed_1.EMBED_COLORS[prefix]) !== null && _a !== void 0 ? _a : embed_1.EMBED_COLORS.success;
        let roleAssigned = false;
        let roleName;
        let isOwner = guild.ownerId === user.id;
        try {
            const result = yield (0, mbtiUtils_1.applyMbtiRoleAndNick)(guild, member, mbtiGroupRoles, selectedType);
            roleAssigned = result.roleAssigned;
            roleName = result.roleName;
            if (result.newNick)
                console.log(`[MBTI] Nickname updated to "${result.newNick}" for ${user.tag} (${user.id}) in guild ${guild.id}`);
            if (roleAssigned)
                console.log(`[MBTI] Role "${roleName}" assigned to ${user.tag} (${user.id}) in guild ${guild.id}`);
        }
        catch (err) {
            console.error(`[MBTI] Role/nickname update failed for ${user.tag} (${user.id}):`, err);
        }
        console.log(`[MBTI] ${user.tag} (${user.id}) selected ${selectedType} in guild ${guild.id}`);
        const desc = [`✅ MBTI 유형이 **${selectedType}**(으)로 저장되었습니다!`];
        if (roleAssigned && roleName)
            desc.push(`**${roleName}** 역할이 부여되었습니다.`);
        if (isOwner)
            desc.push('\n⚠️ 서버 소유자는 닉네임을 직접 변경해주세요.');
        yield interaction.update({
            embeds: [new discord_js_1.EmbedBuilder().setColor(groupColor).setDescription(desc.join('\n'))],
            components: [],
        });
    });
}
