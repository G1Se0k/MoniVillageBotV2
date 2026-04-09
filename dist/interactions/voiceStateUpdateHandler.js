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
exports.handleVoiceStateUpdate = handleVoiceStateUpdate;
const initMember_1 = require("./initMember");
const BOT_NICK_REGEX = /^\S+ .+\/[A-Z]{4} \S+$/;
function handleVoiceStateUpdate(oldState, newState) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (oldState.channelId !== null || newState.channelId === null || !newState.member)
            return;
        if (newState.member.user.bot)
            return;
        if (BOT_NICK_REGEX.test((_a = newState.member.nickname) !== null && _a !== void 0 ? _a : ''))
            return;
        try {
            yield (0, initMember_1.initMember)(newState.member);
        }
        catch (err) {
            console.error(`[voiceStateUpdate] Init failed for ${newState.member.user.id}:`, err);
        }
    });
}
