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
exports.handleNicknameModal = handleNicknameModal;
const discord_js_1 = require("discord.js");
const embed_1 = require("../utils/embed");
const Member_1 = require("../database/models/Member");
const NicknameLog_1 = require("../database/models/NicknameLog");
const mbtiInteraction_1 = require("./mbtiInteraction");
const mbti_1 = require("../constants/mbti");
function handleNicknameModal(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { guild, user } = interaction;
        if (!guild)
            return;
        yield interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const newName = interaction.fields.getTextInputValue(mbti_1.CUSTOM_IDS.NICKNAME_INPUT);
        const userRecord = yield Member_1.Member.findOne({ where: { user_id: user.id, guild_id: guild.id } });
        const mbtiType = (_a = userRecord === null || userRecord === void 0 ? void 0 : userRecord.mbti_type) !== null && _a !== void 0 ? _a : 'NONE';
        const prefix = (mbtiType === 'NONE' ? 'NO' : mbtiType.substring(0, 2));
        const member = yield guild.members.fetch(user.id);
        const displayType = (0, mbtiInteraction_1.resolveDisplayType)(member.nickname, member.displayName, mbtiType);
        const newNick = (0, mbtiInteraction_1.resolveNewNickname)(member.nickname, member.displayName, displayType, prefix, newName);
        try {
            yield member.setNickname(newNick);
            yield NicknameLog_1.NicknameLog.create({ user_id: user.id, guild_id: guild.id, nickname: newNick });
            console.log(`[NICK] Nickname changed to "${newNick}" for ${user.id} in guild ${guild.id}`);
            yield interaction.editReply({ embeds: [(0, embed_1.successEmbed)(`닉네임이 **${newNick}**(으)로 변경되었습니다.`)] });
        }
        catch (err) {
            console.error(`[NICK] Nickname change failed for ${user.id} in guild ${guild.id}:`, err);
            yield interaction.editReply({ embeds: [(0, embed_1.errorEmbed)('닉네임 변경에 실패했습니다. 봇의 권한을 확인해주세요.')] });
        }
    });
}
