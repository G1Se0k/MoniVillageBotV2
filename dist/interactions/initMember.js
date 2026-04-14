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
const Guild_1 = require("../database/models/Guild");
const Member_1 = require("../database/models/Member");
const Role_1 = require("../database/models/Role");
const mbtiInteraction_1 = require("./mbtiInteraction");
function initMember(member) {
    return __awaiter(this, void 0, void 0, function* () {
        const { guild, user } = member;
        let userRecord;
        let mbtiGroupRoles;
        try {
            yield Guild_1.Guild.findOrCreate({ where: { id: guild.id } });
            [[userRecord], mbtiGroupRoles] = yield Promise.all([
                Member_1.Member.findOrCreate({
                    where: { user_id: user.id, guild_id: guild.id },
                    defaults: { user_id: user.id, guild_id: guild.id, mbti_type: 'NONE' },
                }),
                (0, Role_1.findMbtiGroupRoles)(guild.id),
            ]);
            console.log(`[INIT] DB record ensured for ${user.id} in guild ${guild.id}`);
        }
        catch (err) {
            console.error(`[INIT] DB record creation failed for ${user.id} in guild ${guild.id}:`, err);
            return;
        }
        const mbtiType = userRecord.mbti_type;
        const prefix = (mbtiType === 'NONE' ? 'NO' : mbtiType.substring(0, 2));
        const targetRole = mbtiGroupRoles.find((r) => r.name.startsWith(prefix));
        try {
            if (targetRole && !member.roles.cache.has(targetRole.role_id)) {
                yield member.roles.add(targetRole.role_id);
                console.log(`[INIT] Role "${targetRole.name}" assigned to ${user.id} in guild ${guild.id}`);
            }
        }
        catch (err) {
            console.error(`[INIT] Role assignment failed for ${user.id} in guild ${guild.id}:`, err);
        }
        if (guild.ownerId === user.id) {
            console.log(`[INIT] Skipped nickname change for guild owner ${user.id} in guild ${guild.id}`);
            return;
        }
        const displayType = (0, mbtiInteraction_1.resolveDisplayType)(member.nickname, member.displayName, mbtiType);
        const newNick = (0, mbtiInteraction_1.resolveNewNickname)(member.nickname, member.displayName, displayType, prefix);
        try {
            yield member.setNickname(newNick);
            console.log(`[INIT] Nickname set to "${newNick}" for ${user.id} in guild ${guild.id}`);
        }
        catch (err) {
            console.error(`[INIT] Nickname set failed for ${user.id} in guild ${guild.id}:`, err);
        }
    });
}
