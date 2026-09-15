import { Client } from 'discord.js';
import { creditCoin } from '@moni/shared';

const CHAT_THRESHOLD = 30;
const CHAT_COOLDOWN_MS = 5 * 60 * 1000;
const VOICE_CHUNK_MS = 5 * 60 * 1000;
const VOICE_TICK_MS = 60 * 1000;

// ponytail: 봇 프로세스 재시작 시 카운터 리셋 — friend server 규모 감안, 감수
const chatState = new Map<string, { count: number; lastEarnedAt: number }>();
const voiceStart = new Map<string, number>();

export function registerCoinRewards(client: Client) {
  client.on('messageCreate', async (msg) => {
    if (msg.author.bot || !msg.inGuild()) return;
    const uid = msg.author.id;
    const state = chatState.get(uid) ?? { count: 0, lastEarnedAt: 0 };
    state.count += 1;
    const now = Date.now();
    if (state.count >= CHAT_THRESHOLD) {
      if (now - state.lastEarnedAt >= CHAT_COOLDOWN_MS) {
        try {
          await creditCoin(uid, 1);
          console.log(`[coin] chat +1 → ${msg.author.tag}`);
        } catch (e) {
          console.error('[coinRewards] chat credit failed', e);
        }
        state.count = 0;
        state.lastEarnedAt = now;
      } else {
        state.count = CHAT_THRESHOLD;
      }
    }
    chatState.set(uid, state);
  });

  client.on('voiceStateUpdate', (oldState, newState) => {
    const uid = newState.id;
    const wasIn = !!oldState.channelId;
    const nowIn = !!newState.channelId;
    if (!wasIn && nowIn) voiceStart.set(uid, Date.now());
    else if (wasIn && !nowIn) voiceStart.delete(uid);
  });

  client.once('ready', () => {
    for (const guild of client.guilds.cache.values()) {
      guild.voiceStates.cache.forEach((state) => {
        if (state.channelId && !state.member?.user.bot) {
          voiceStart.set(state.id, Date.now());
        }
      });
    }
  });

  setInterval(async () => {
    const now = Date.now();
    for (const [uid, start] of voiceStart.entries()) {
      const chunks = Math.floor((now - start) / VOICE_CHUNK_MS);
      if (chunks < 1) continue;
      try {
        await creditCoin(uid, chunks);
        console.log(`[coin] voice +${chunks} → ${uid}`);
      } catch (e) {
        console.error('[coinRewards] voice credit failed', e);
      }
      voiceStart.set(uid, start + chunks * VOICE_CHUNK_MS);
    }
  }, VOICE_TICK_MS);
}
