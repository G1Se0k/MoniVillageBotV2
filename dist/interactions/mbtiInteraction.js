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
exports.resolveNewNickname = resolveNewNickname;
exports.handleMbtiSelect = handleMbtiSelect;
const MV_MBTI_1 = require("../database/models/MV_MBTI");
const MV_USER_1 = require("../database/models/MV_USER");
const MV_ROLE_1 = require("../database/models/MV_ROLE");
const MBTI_GROUP_EMOJIS = {
    IS: '🟩',
    IN: '🟦',
    ES: '🟥',
    EN: '🟧',
    NO: '⬛',
};
const OUR_EMOJI_SET = new Set(Object.values(MBTI_GROUP_EMOJIS));
function resolveNewNickname(currentNick, displayName, selectedType, prefix, overrideName) {
    const source = currentNick !== null && currentNick !== void 0 ? currentNick : displayName;
    // Use the first non-MBTI emoji found; fall back to MBTI group emoji
    const foundEmojis = [...source.matchAll(/\p{Emoji_Presentation}/gu)].map((m) => m[0]);
    const otherEmoji = foundEmojis.find((e) => !OUR_EMOJI_SET.has(e));
    const emoji = otherEmoji !== null && otherEmoji !== void 0 ? otherEmoji : MBTI_GROUP_EMOJIS[prefix];
    // overrideName이 있으면 직접 사용, 없으면 source에서 이름 추출
    let baseName;
    if (overrideName) {
        baseName = [...overrideName].slice(-2).join('');
    }
    else {
        const botMatch = source.match(/^\S+ (.+?)\/[A-Z]{4} \S+$/);
        const rawName = botMatch ? botMatch[1] : source;
        baseName = [...rawName].slice(-2).join('');
    }
    return `${emoji} ${baseName}/${selectedType} ${emoji}`;
}
function handleMbtiSelect(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const { guild, user } = interaction;
        if (!guild)
            return;
        const selectedType = interaction.values[0];
        const userRecord = yield MV_USER_1.MV_USER.findOne({ where: { USER_ID: user.id, GUILD_ID: guild.id } });
        if ((userRecord === null || userRecord === void 0 ? void 0 : userRecord.MBTI_TYPE) === selectedType) {
            yield interaction.update({
                content: `이미 **${selectedType}**(으)로 선택되어 있습니다.`,
                components: [],
            });
            return;
        }
        const prefix = selectedType.substring(0, 2);
        const [mbtiGroupRoles] = yield Promise.all([
            (0, MV_ROLE_1.findMbtiGroupRoles)(guild.id),
            MV_MBTI_1.MV_MBTI.create({ USER_ID: user.id, GUILD_ID: guild.id, MBTI_TYPE: selectedType }),
            MV_USER_1.MV_USER.upsert({ USER_ID: user.id, GUILD_ID: guild.id, MBTI_TYPE: selectedType }),
        ]);
        const matchingRole = mbtiGroupRoles.find((r) => r.ROLE_NAME.startsWith(prefix));
        let roleAssigned = false;
        try {
            const member = yield guild.members.fetch(user.id);
            const staleRoleIds = mbtiGroupRoles.map((r) => r.ROLE_ID).filter((id) => member.roles.cache.has(id));
            if (staleRoleIds.length > 0)
                yield member.roles.remove(staleRoleIds);
            if (matchingRole) {
                yield member.roles.add(matchingRole.ROLE_ID);
                roleAssigned = true;
                console.log(`[MBTI] Assigned role "${matchingRole.ROLE_NAME}" to ${user.tag} (${user.id}) in guild ${guild.id}`);
            }
            const newNick = resolveNewNickname(member.nickname, member.displayName, selectedType === 'NONE' ? 'BABO' : selectedType, prefix);
            yield member.setNickname(newNick);
            console.log(`[MBTI] Nickname updated to "${newNick}" for ${user.tag} (${user.id}) in guild ${guild.id}`);
        }
        catch (err) {
            console.error(`[MBTI] Role assignment failed for ${user.tag} (${user.id}):`, err);
        }
        console.log(`[MBTI] ${user.tag} (${user.id}) selected ${selectedType} in guild ${guild.id}`);
        yield interaction.update({
            content: `✅ MBTI 유형이 **${selectedType}**(으)로 저장되었습니다!${roleAssigned && matchingRole ? ` **${matchingRole.ROLE_NAME}** 역할이 부여되었습니다.` : ''}`,
            components: [],
        });
    });
}
