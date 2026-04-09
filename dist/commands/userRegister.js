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
const MV_GUILD_1 = require("../database/models/MV_GUILD");
const MV_USER_1 = require("../database/models/MV_USER");
exports.userRegister = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('유저등록')
        .setDescription('유저를 등록합니다.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    execute: (_, interaction) => __awaiter(void 0, void 0, void 0, function* () {
        const { guild, user } = interaction;
        if (!guild)
            return;
        const [, guildCreated] = yield MV_GUILD_1.MV_GUILD.findOrCreate({ where: { GUILD_ID: guild.id } });
        if (guildCreated)
            console.log(`Guild registered: ${guild.id}`);
        const [, userCreated] = yield MV_USER_1.MV_USER.findOrCreate({ where: { USER_ID: user.id, GUILD_ID: guild.id } });
        if (userCreated)
            console.log(`User registered: ${user.id} in guild ${guild.id}`);
        else
            console.log(`User already registered: ${user.id} in guild ${guild.id}`);
        yield interaction.editReply({ content: `${user} 등록 완료!` });
    }),
};
