import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import commands from './commands';
import { connectDatabase, CUSTOM_IDS } from '@moni/shared';
import { handleMbtiSelect } from './interactions/mbtiInteraction';
import { handleNicknameModal } from './interactions/nicknameModalHandler';
import { handleCustomMbtiModal } from './interactions/customMbtiModalHandler';
import { handleGuildMemberAdd } from './interactions/guildMemberAddHandler';
import { handleRoleDelete } from './interactions/roleDeleteHandler';
import { registerCoinRewards } from './interactions/coinRewards';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once('ready', async () => {
  if (!client.application) return;
  await client.application.commands.set(commands.map((c) => c.data));
  console.log('Commands registered');
  await connectDatabase();
  console.log('Bot ready!');
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = commands.find((c) => c.data.name === interaction.commandName);
    if (!command) return;

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

  if (interaction.isModalSubmit()) {
    if (interaction.customId === CUSTOM_IDS.NICKNAME_MODAL) await handleNicknameModal(interaction);
    else if (interaction.customId === CUSTOM_IDS.CUSTOM_MBTI_MODAL) await handleCustomMbtiModal(interaction);
  }
});

client.on('guildMemberAdd', handleGuildMemberAdd);
client.on('roleDelete', handleRoleDelete);

registerCoinRewards(client);

void client.login(process.env.TOKEN);
