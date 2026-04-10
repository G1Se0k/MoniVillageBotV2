import { Message } from 'discord.js';
import { initMember } from './initMember';
import { BOT_NICK_REGEX } from '../constants/mbti';

export async function handleMessageCreate(message: Message) {
  if (message.author.bot || !message.guild || !message.member) return;
  if (BOT_NICK_REGEX.test(message.member.nickname ?? '')) return;
  try {
    await initMember(message.member);
  } catch (err) {
    console.error(`[messageCreate] Init failed for ${message.author.id}:`, err);
  }
}