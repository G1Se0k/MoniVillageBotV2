import { VoiceState } from 'discord.js';
import { initMember } from './initMember';

const BOT_NICK_REGEX = /^\S+ .+\/[A-Z]{4} \S+$/;

export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  if (oldState.channelId !== null || newState.channelId === null || !newState.member) return;
  if (newState.member.user.bot) return;
  if (BOT_NICK_REGEX.test(newState.member.nickname ?? '')) return;
  try {
    await initMember(newState.member);
  } catch (err) {
    console.error(`[voiceStateUpdate] Init failed for ${newState.member.user.id}:`, err);
  }
}