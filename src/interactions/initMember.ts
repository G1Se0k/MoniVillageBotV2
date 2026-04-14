import { GuildMember } from 'discord.js';
import { Guild } from '../database/models/Guild';
import { Member } from '../database/models/Member';
import { findMbtiGroupRoles } from '../database/models/Role';
import { MbtiRolePrefix } from '../constants/mbti';
import { resolveNewNickname, resolveDisplayType } from './mbtiInteraction';

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
  const prefix = (mbtiType === 'NONE' ? 'NO' : mbtiType.substring(0, 2)) as MbtiRolePrefix;
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
  const newNick = resolveNewNickname(member.nickname, member.displayName, displayType, prefix);
  try {
    await member.setNickname(newNick);
    console.log(`[INIT] Nickname set to "${newNick}" for ${user.id} in guild ${guild.id}`);
  } catch (err) {
    console.error(`[INIT] Nickname set failed for ${user.id} in guild ${guild.id}:`, err);
  }
}
