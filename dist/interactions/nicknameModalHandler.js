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
const MV_USER_1 = require("../database/models/MV_USER");
const MV_NICKNAME_1 = require("../database/models/MV_NICKNAME");
const mbtiInteraction_1 = require("./mbtiInteraction");
const mbti_1 = require("../constants/mbti");
function handleNicknameModal(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { guild, user } = interaction;
        if (!guild)
            return;
        yield interaction.deferReply({ ephemeral: true });
        const newName = interaction.fields.getTextInputValue(mbti_1.CUSTOM_IDS.NICKNAME_INPUT);
        const userRecord = yield MV_USER_1.MV_USER.findOne({ where: { USER_ID: user.id, GUILD_ID: guild.id } });
        const mbtiType = (_a = userRecord === null || userRecord === void 0 ? void 0 : userRecord.MBTI_TYPE) !== null && _a !== void 0 ? _a : 'NONE';
        const displayType = mbtiType === 'NONE' ? 'BABO' : mbtiType;
        const prefix = (mbtiType === 'NONE' ? 'NO' : mbtiType.substring(0, 2));
        const member = yield guild.members.fetch(user.id);
        const newNick = (0, mbtiInteraction_1.resolveNewNickname)(member.nickname, member.displayName, displayType, prefix, newName);
        try {
            yield member.setNickname(newNick);
            yield MV_NICKNAME_1.MV_NICKNAME.create({ USER_ID: user.id, GUILD_ID: guild.id, NICKNAME: newNick });
            console.log(`[NICK] Nickname changed to "${newNick}" for ${user.id} in guild ${guild.id}`);
            yield interaction.editReply({ content: `닉네임이 **${newNick}**(으)로 변경되었습니다.` });
        }
        catch (err) {
            console.error(`[NICK] Nickname change failed for ${user.id} in guild ${guild.id}:`, err);
            yield interaction.editReply({ content: '닉네임 변경에 실패했습니다. 봇의 권한을 확인해주세요.' });
        }
    });
}
