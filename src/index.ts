import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import commands from './commands';
import { connectDatabase } from './database/database';
import { handleMbtiSelect } from './interactions/mbtiInteraction';
import { handleNicknameModal } from './interactions/nicknameModalHandler';
import { handleMessageCreate } from './interactions/messageCreateHandler';
import { handleVoiceStateUpdate } from './interactions/voiceStateUpdateHandler';
import { CUSTOM_IDS } from './constants/mbti';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
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
      await interaction.deferReply({ ephemeral: true });
    }
    await command.execute(client, interaction);
    console.log(`Command executed: ${command.data.name}`);
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

client.on('messageCreate', handleMessageCreate);
client.on('voiceStateUpdate', handleVoiceStateUpdate);

(async () => {
  await client.login(process.env.TOKEN);
})();
