import { EmbedBuilder } from 'discord.js';

export const EMBED_COLORS = {
  primary: 0x5865f2,
  success: 0x57f287,
  error: 0xed4245,
  warning: 0xfee75c,
  // MBTI group colors
  IS: 0x1f8b4c,
  IN: 0x3498db,
  ES: 0xe91e63,
  EN: 0xe67e22,
  NO: 0x546e7a,
} as const;

export function infoEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(EMBED_COLORS.primary).setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

export function successEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(EMBED_COLORS.success).setDescription(description);
}

export function errorEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(EMBED_COLORS.error).setDescription(description);
}

export function warnEmbed(description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(EMBED_COLORS.warning).setDescription(description);
}
