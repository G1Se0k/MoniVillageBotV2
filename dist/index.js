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
const messageCreateHandler_1 = require("./interactions/messageCreateHandler");
const voiceStateUpdateHandler_1 = require("./interactions/voiceStateUpdateHandler");
const mbti_1 = require("./constants/mbti");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
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
    if (interaction.isChatInputCommand()) {
        const command = commands_1.default.find((c) => c.data.name === interaction.commandName);
        if (!command)
            return;
        if (!command.handlesDeferral) {
            yield interaction.deferReply({ ephemeral: true });
        }
        yield command.execute(client, interaction);
        console.log(`Command executed: ${command.data.name}`);
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
}));
client.on('messageCreate', messageCreateHandler_1.handleMessageCreate);
client.on('voiceStateUpdate', voiceStateUpdateHandler_1.handleVoiceStateUpdate);
client.login(process.env.TOKEN);
