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
exports.initMember = initMember;
const MV_GUILD_1 = require("../database/models/MV_GUILD");
const MV_USER_1 = require("../database/models/MV_USER");
const MV_ROLE_1 = require("../database/models/MV_ROLE");
const mbtiInteraction_1 = require("./mbtiInteraction");
function initMember(member) {
    return __awaiter(this, void 0, void 0, function* () {
        const { guild, user } = member;
        try {
            yield MV_GUILD_1.MV_GUILD.findOrCreate({ where: { GUILD_ID: guild.id } });
            yield MV_USER_1.MV_USER.findOrCreate({
                where: { USER_ID: user.id, GUILD_ID: guild.id },
                defaults: { USER_ID: user.id, GUILD_ID: guild.id, MBTI_TYPE: 'NONE' },
            });
            console.log(`[INIT] DB record created for ${user.id} in guild ${guild.id}`);
        }
        catch (err) {
            console.error(`[INIT] DB record creation failed for ${user.id} in guild ${guild.id}:`, err);
            return;
        }
        try {
            const mbtiGroupRoles = yield (0, MV_ROLE_1.findMbtiGroupRoles)(guild.id);
            const noRole = mbtiGroupRoles.find((r) => r.ROLE_NAME.startsWith('NO'));
            if (noRole) {
                yield member.roles.add(noRole.ROLE_ID);
                console.log(`[INIT] Role "${noRole.ROLE_NAME}" assigned to ${user.id} in guild ${guild.id}`);
            }
        }
        catch (err) {
            console.error(`[INIT] Role assignment failed for ${user.id} in guild ${guild.id}:`, err);
        }
        const newNick = (0, mbtiInteraction_1.resolveNewNickname)(member.nickname, member.displayName, 'BABO', 'NO');
        try {
            yield member.setNickname(newNick);
            console.log(`[INIT] Nickname set to "${newNick}" for ${user.id} in guild ${guild.id}`);
        }
        catch (err) {
            console.error(`[INIT] Nickname set failed for ${user.id} in guild ${guild.id}:`, err);
        }
    });
}
