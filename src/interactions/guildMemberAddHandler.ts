import { GuildMember } from 'discord.js';
import { initMember } from './initMember';

export async function handleGuildMemberAdd(member: GuildMember) {
  if (member.user.bot) return;
  try {
    await initMember(member);
  } catch (err) {
    console.error(`[guildMemberAdd] Init failed for ${member.user.id}:`, err);
  }
}
