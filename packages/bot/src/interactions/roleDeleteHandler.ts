import { Role as DiscordRole } from 'discord.js';
import { Role, invalidateMbtiRoleCache, MBTI_ROLE_PREFIXES } from '@moni/shared';

export async function handleRoleDelete(role: DiscordRole) {
  const deleted = await Role.destroy({ where: { role_id: role.id } });
  if (deleted === 0) return;

  const isMbtiRole = MBTI_ROLE_PREFIXES.some((prefix) => role.name.startsWith(prefix));
  if (isMbtiRole) {
    invalidateMbtiRoleCache(role.guild.id);
    console.log(`[ROLE] MBTI group role "${role.name}" (${role.id}) deleted — cache invalidated in guild ${role.guild.id}`);
  } else {
    console.log(`[ROLE] Role "${role.name}" (${role.id}) removed from DB in guild ${role.guild.id}`);
  }
}
