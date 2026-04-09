import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../types/slashCommand';
import { MV_GUILD } from '../database/models/MV_GUILD';
import { MV_USER } from '../database/models/MV_USER';

export const userRegister: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('유저등록')
    .setDescription('유저를 등록합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  execute: async (_, interaction: ChatInputCommandInteraction) => {
    const { guild, user } = interaction;
    if (!guild) return;

    const [, guildCreated] = await MV_GUILD.findOrCreate({ where: { GUILD_ID: guild.id } });
    if (guildCreated) console.log(`Guild registered: ${guild.id}`);

    const [, userCreated] = await MV_USER.findOrCreate({ where: { USER_ID: user.id, GUILD_ID: guild.id } });
    if (userCreated) console.log(`User registered: ${user.id} in guild ${guild.id}`);
    else console.log(`User already registered: ${user.id} in guild ${guild.id}`);

    await interaction.editReply({ content: `${user} 등록 완료!` });
  },
};