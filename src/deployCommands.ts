import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import commands from './commands';

const token = process.env.TOKEN as string;
const clientId = process.env.CLIENTID as string;
const guildId = process.env.GUILDID as string;

const rest = new REST().setToken(token);

(async () => {
  try {
    const body = commands.map((command) => command.data.toJSON());
    console.log(`Deploying ${body.length} command(s)...`);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
    console.log('Commands deployed successfully.');
  } catch (error) {
    console.error(error);
  }
})();