import { GuildMember } from 'discord.js';
import { Guild, Member, findMbtiGroupRoles } from '@moni/shared';
import { mbtiTypeToPrefix, resolveDisplayType, resolveNewNickname } from './mbtiUtils';

export async function initMember(member: GuildMember) {
  const { guild, user } = member;

  let userRecord: Member;
  let mbtiGroupRoles;
  try {
    await Guild.findOrCreate({ where: { id: guild.id } });
    [[userRecord], mbtiGroupRoles] = await Promise.all([
      Member.findOrCreate({
        where: { user_id: user.id, guild_id: guild.id },
        defaults: { user_id: user.id, guild_id: guild.id, mbti_type: 'NONE' },
      }),
      findMbtiGroupRoles(guild.id),
    ]);
    console.log(`[INIT] DB record ensured for ${user.id} in guild ${guild.id}`);
  } catch (err) {
    console.error(`[INIT] DB record creation failed for ${user.id} in guild ${guild.id}:`, err);
    return;
  }

  const mbtiType = userRecord.mbti_type;
  const prefix = mbtiTypeToPrefix(mbtiType);
  const targetRole = mbtiGroupRoles.find((r) => r.name.startsWith(prefix));

  try {
    if (targetRole && !member.roles.cache.has(targetRole.role_id)) {
      await member.roles.add(targetRole.role_id);
      console.log(`[INIT] Role "${targetRole.name}" assigned to ${user.id} in guild ${guild.id}`);
    }
  } catch (err) {
    console.error(`[INIT] Role assignment failed for ${user.id} in guild ${guild.id}:`, err);
  }

  if (guild.ownerId === user.id) {
    console.log(`[INIT] Skipped nickname change for guild owner ${user.id} in guild ${guild.id}`);
    return;
  }

  const displayType = resolveDisplayType(member.nickname, member.displayName, mbtiType);
  const newNick = resolveNewNickname(member.nickname, member.displayName, displayType, prefix, undefined, undefined, !!member.premiumSince);
  try {
    await member.setNickname(newNick);
    console.log(`[INIT] Nickname set to "${newNick}" for ${user.id} in guild ${guild.id}`);
  } catch (err) {
    console.error(`[INIT] Nickname set failed for ${user.id} in guild ${guild.id}:`, err);
  }
}
