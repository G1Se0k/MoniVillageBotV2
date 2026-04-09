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
exports.nickname = void 0;
const discord_js_1 = require("discord.js");
const mbti_1 = require("../constants/mbti");
const MV_NICKNAME_1 = require("../database/models/MV_NICKNAME");
const COOLDOWN_DAYS = 7;
exports.nickname = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('닉네임')
        .setDescription('닉네임을 관리합니다.')
        .addSubcommand((sub) => sub.setName('변경').setDescription('닉네임을 변경합니다.')),
    handlesDeferral: true,
    execute: (_, interaction) => __awaiter(void 0, void 0, void 0, function* () {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === '변경') {
            const { user, guild } = interaction;
            if (!guild)
                return;
            const lastChange = yield MV_NICKNAME_1.MV_NICKNAME.findOne({
                where: { USER_ID: user.id, GUILD_ID: guild.id },
                order: [['CHANGED_AT', 'DESC']],
            });
            if (lastChange) {
                const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
                const elapsed = Date.now() - new Date(lastChange.CHANGED_AT).getTime();
                if (elapsed < cooldownMs) {
                    const remaining = Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000));
                    yield interaction.reply({
                        content: `닉네임 변경은 마지막 변경으로부터 **${COOLDOWN_DAYS}일** 후에 가능합니다.\n**${remaining}일** 후에 다시 시도해주세요.`,
                        ephemeral: true,
                    });
                    return;
                }
            }
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId(mbti_1.CUSTOM_IDS.NICKNAME_MODAL)
                .setTitle('닉네임 변경');
            const nameInput = new discord_js_1.TextInputBuilder()
                .setCustomId(mbti_1.CUSTOM_IDS.NICKNAME_INPUT)
                .setLabel('닉네임 (2글자)')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setMinLength(2)
                .setMaxLength(2)
                .setPlaceholder('변경할 닉네임을 입력하세요')
                .setRequired(true);
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(nameInput));
            yield interaction.showModal(modal);
        }
    }),
};
