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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const commands_1 = __importDefault(require("./commands"));
const database_1 = require("./database/database");
const mbtiInteraction_1 = require("./interactions/mbtiInteraction");
const nicknameModalHandler_1 = require("./interactions/nicknameModalHandler");
const customMbtiModalHandler_1 = require("./interactions/customMbtiModalHandler");
const guildMemberAddHandler_1 = require("./interactions/guildMemberAddHandler");
const roleDeleteHandler_1 = require("./interactions/roleDeleteHandler");
const mbti_1 = require("./constants/mbti");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessages,
    ],
});
client.once('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    if (!client.application)
        return;
    yield client.application.commands.set(commands_1.default.map((command) => command.data));
    console.log('Commands registered');
    yield (0, database_1.connectDatabase)();
    console.log('Bot ready!');
}));
client.on('interactionCreate', (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (interaction.isChatInputCommand()) {
        const command = commands_1.default.find((c) => c.data.name === interaction.commandName);
        if (!command)
            return;
        if (!command.handlesDeferral) {
            yield interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        }
        yield command.execute(client, interaction);
        const subcommand = interaction.options.getSubcommand(false);
        const fullCommand = subcommand ? `/${command.data.name} ${subcommand}` : `/${command.data.name}`;
        const guildName = (_b = (_a = interaction.guild) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '알 수 없는 서버';
        const nickname = interaction.member && 'displayName' in interaction.member
            ? interaction.member.displayName
            : interaction.user.username;
        console.log(`[CMD] ${guildName} | ${nickname} | ${fullCommand}`);
        return;
    }
    if (interaction.isStringSelectMenu() && interaction.customId === mbti_1.CUSTOM_IDS.MBTI_SELECT) {
        yield (0, mbtiInteraction_1.handleMbtiSelect)(interaction);
        return;
    }
    if (interaction.isModalSubmit() && interaction.customId === mbti_1.CUSTOM_IDS.NICKNAME_MODAL) {
        yield (0, nicknameModalHandler_1.handleNicknameModal)(interaction);
        return;
    }
    if (interaction.isModalSubmit() && interaction.customId === mbti_1.CUSTOM_IDS.CUSTOM_MBTI_MODAL) {
        yield (0, customMbtiModalHandler_1.handleCustomMbtiModal)(interaction);
        return;
    }
}));
client.on('guildMemberAdd', guildMemberAddHandler_1.handleGuildMemberAdd);
client.on('roleDelete', roleDeleteHandler_1.handleRoleDelete);
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield client.login(process.env.TOKEN);
}))();
