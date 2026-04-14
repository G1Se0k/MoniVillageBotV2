import 'dotenv/config';
import { Client, GatewayIntentBits, MessageFlags } from 'discord.js';
import commands from './commands';
import { connectDatabase } from './database/database';
import { handleMbtiSelect } from './interactions/mbtiInteraction';
import { handleNicknameModal } from './interactions/nicknameModalHandler';
import { handleGuildMemberAdd } from './interactions/guildMemberAddHandler';
import { handleRoleDelete } from './interactions/roleDeleteHandler';
import { CUSTOM_IDS } from './constants/mbti';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

client.once('ready', async () => {
  if (!client.application) return;

  await client.application.commands.set(commands.map((command) => command.data));
  console.log('Commands registered');

  await connectDatabase();
  console.log('Bot ready!');
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = commands.find((c) => c.data.name === interaction.commandName);
    if (!command) return;

    if (!command.handlesDeferral) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    }
    await command.execute(client, interaction);

    const subcommand = interaction.options.getSubcommand(false);
    const fullCommand = subcommand ? `/${command.data.name} ${subcommand}` : `/${command.data.name}`;
    const guildName = interaction.guild?.name ?? '알 수 없는 서버';
    const nickname = interaction.member && 'displayName' in interaction.member
      ? interaction.member.displayName
      : interaction.user.username;
    console.log(`[CMD] ${guildName} | ${nickname} | ${fullCommand}`);
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === CUSTOM_IDS.MBTI_SELECT) {
    await handleMbtiSelect(interaction);
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId === CUSTOM_IDS.NICKNAME_MODAL) {
    await handleNicknameModal(interaction);
    return;
  }
});

client.on('guildMemberAdd', handleGuildMemberAdd);
client.on('roleDelete', handleRoleDelete);

(async () => {
  await client.login(process.env.TOKEN);
})();
