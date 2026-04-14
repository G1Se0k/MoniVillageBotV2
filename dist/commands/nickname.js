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
const embed_1 = require("../utils/embed");
const mbti_1 = require("../constants/mbti");
const NicknameLog_1 = require("../database/models/NicknameLog");
exports.nickname = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('닉네임')
        .setDescription('닉네임을 관리합니다.')
        .addSubcommand((sub) => sub.setName('변경').setDescription('닉네임을 변경합니다.'))
        .addSubcommand((sub) => sub.setName('히스토리').setDescription('나의 닉네임 변경 히스토리를 조회합니다.')),
    handlesDeferral: true,
    execute: (_, interaction) => __awaiter(void 0, void 0, void 0, function* () {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === '변경') {
            const { user, guild } = interaction;
            if (!guild)
                return;
            const lastChange = yield NicknameLog_1.NicknameLog.findOne({
                where: { user_id: user.id, guild_id: guild.id },
                order: [['created_at', 'DESC']],
            });
            if (guild.ownerId === user.id) {
                yield interaction.reply({ embeds: [(0, embed_1.warnEmbed)('서버 소유자는 봇이 닉네임을 변경할 수 없습니다.')], flags: discord_js_1.MessageFlags.Ephemeral });
                return;
            }
            if (lastChange) {
                const elapsed = Date.now() - new Date(lastChange.created_at).getTime();
                if (elapsed < mbti_1.COOLDOWN_MS) {
                    const remaining = Math.ceil((mbti_1.COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
                    yield interaction.reply({
                        embeds: [(0, embed_1.warnEmbed)(`닉네임 변경은 마지막 변경으로부터 **${mbti_1.COOLDOWN_DAYS}일** 후에 가능합니다.\n**${remaining}일** 후에 다시 시도해주세요.`)],
                        flags: discord_js_1.MessageFlags.Ephemeral,
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
            return;
        }
        if (subcommand === '히스토리') {
            yield interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            const { user, guild } = interaction;
            if (!guild)
                return;
            const history = yield NicknameLog_1.NicknameLog.findAll({
                where: { user_id: user.id, guild_id: guild.id },
                order: [['created_at', 'DESC']],
                limit: 10,
            });
            if (history.length === 0) {
                yield interaction.editReply({ embeds: [(0, embed_1.warnEmbed)('아직 닉네임을 변경한 기록이 없습니다.')] });
                return;
            }
            const list = history
                .map((h, i) => `${i + 1}. **${h.nickname}** — ${new Date(h.created_at).toLocaleString('ko-KR')}`)
                .join('\n');
            yield interaction.editReply({ embeds: [(0, embed_1.infoEmbed)(`${user.displayName}의 닉네임 히스토리`, list)] });
        }
    }),
};
