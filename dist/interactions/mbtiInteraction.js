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
exports.resolveDisplayType = resolveDisplayType;
exports.resolveNewNickname = resolveNewNickname;
exports.handleMbtiSelect = handleMbtiSelect;
const discord_js_1 = require("discord.js");
const embed_1 = require("../utils/embed");
const MbtiLog_1 = require("../database/models/MbtiLog");
const Member_1 = require("../database/models/Member");
const Role_1 = require("../database/models/Role");
const mbti_1 = require("../constants/mbti");
const OUR_EMOJI_SET = new Set(Object.values(mbti_1.GROUP_EMOJIS));
/**
 * 닉네임에서 커스텀 4글자 타입을 보존하거나, mbtiType 기반으로 표시 타입을 결정합니다.
 * 커스텀 타입(MBTI/BABO가 아닌 4글자 영어)이 있으면 그대로 유지합니다.
 */
function resolveDisplayType(nickname, displayName, mbtiType) {
    var _a;
    const source = nickname !== null && nickname !== void 0 ? nickname : displayName;
    const currentType = (_a = mbti_1.NICK_TYPE_REGEX.exec(source)) === null || _a === void 0 ? void 0 : _a[1];
    if (currentType && !mbti_1.MBTI_TYPE_SET.has(currentType))
        return currentType;
    return mbtiType === 'NONE' ? 'BABO' : mbtiType;
}
function resolveNewNickname(currentNick, displayName, selectedType, prefix, overrideName) {
    const source = currentNick !== null && currentNick !== void 0 ? currentNick : displayName;
    // Use the first non-MBTI emoji found; fall back to MBTI group emoji
    const foundEmojis = [...source.matchAll(/\p{Emoji_Presentation}/gu)].map((m) => m[0]);
    const otherEmoji = foundEmojis.find((e) => !OUR_EMOJI_SET.has(e));
    const emoji = otherEmoji !== null && otherEmoji !== void 0 ? otherEmoji : mbti_1.GROUP_EMOJIS[prefix];
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
        var _a;
        const { guild, user } = interaction;
        if (!guild)
            return;
        const selectedType = interaction.values[0];
        const userRecord = yield Member_1.Member.findOne({ where: { user_id: user.id, guild_id: guild.id } });
        if ((userRecord === null || userRecord === void 0 ? void 0 : userRecord.mbti_type) === selectedType) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(embed_1.EMBED_COLORS.warning)
                .setDescription(`이미 **${selectedType}**(으)로 선택되어 있습니다.`);
            yield interaction.update({ embeds: [embed], components: [] });
            return;
        }
        const prefix = selectedType.substring(0, 2);
        const [mbtiGroupRoles] = yield Promise.all([
            (0, Role_1.findMbtiGroupRoles)(guild.id),
            MbtiLog_1.MbtiLog.create({ user_id: user.id, guild_id: guild.id, mbti_type: selectedType }),
            Member_1.Member.upsert({ user_id: user.id, guild_id: guild.id, mbti_type: selectedType }),
        ]);
        const matchingRole = mbtiGroupRoles.find((r) => r.name.startsWith(prefix));
        const isOwner = guild.ownerId === user.id;
        let roleAssigned = false;
        try {
            const member = yield guild.members.fetch(user.id);
            const staleRoleIds = mbtiGroupRoles.map((r) => r.role_id).filter((id) => member.roles.cache.has(id));
            const displayType = resolveDisplayType(member.nickname, member.displayName, selectedType);
            const newNick = resolveNewNickname(member.nickname, member.displayName, displayType, prefix);
            yield Promise.all([
                ...(staleRoleIds.length > 0 ? [member.roles.remove(staleRoleIds)] : []),
                ...(matchingRole ? [member.roles.add(matchingRole.role_id)] : []),
                ...(!isOwner ? [member.setNickname(newNick)] : []),
            ]);
            if (matchingRole) {
                roleAssigned = true;
                console.log(`[MBTI] Assigned role "${matchingRole.name}" to ${user.tag} (${user.id}) in guild ${guild.id}`);
            }
            if (!isOwner) {
                console.log(`[MBTI] Nickname updated to "${newNick}" for ${user.tag} (${user.id}) in guild ${guild.id}`);
            }
        }
        catch (err) {
            console.error(`[MBTI] Role assignment failed for ${user.tag} (${user.id}):`, err);
        }
        console.log(`[MBTI] ${user.tag} (${user.id}) selected ${selectedType} in guild ${guild.id}`);
        const groupColor = (_a = embed_1.EMBED_COLORS[prefix]) !== null && _a !== void 0 ? _a : embed_1.EMBED_COLORS.success;
        const desc = [`✅ MBTI 유형이 **${selectedType}**(으)로 저장되었습니다!`];
        if (roleAssigned && matchingRole)
            desc.push(`**${matchingRole.name}** 역할이 부여되었습니다.`);
        if (isOwner)
            desc.push('\n⚠️ 서버 소유자는 닉네임을 직접 변경해주세요.');
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(groupColor)
            .setDescription(desc.join('\n'));
        yield interaction.update({ embeds: [embed], components: [] });
    });
}
