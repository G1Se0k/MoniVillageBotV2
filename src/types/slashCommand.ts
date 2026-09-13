import { Client, SlashCommandBuilder, ChatInputCommandInteraction, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export type SlashCommand = {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (client: Client, interaction: ChatInputCommandInteraction) => Promise<void> | void;
};
