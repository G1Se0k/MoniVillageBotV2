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
const token = process.env.TOKEN;
const clientId = process.env.CLIENTID;
const guildId = process.env.GUILDID;
const rest = new discord_js_1.REST().setToken(token);
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = commands_1.default.map((command) => command.data.toJSON());
        console.log(`Deploying ${body.length} command(s)...`);
        yield rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), { body });
        console.log('Commands deployed successfully.');
    }
    catch (error) {
        console.error(error);
    }
}))();
