import { GuildMember } from 'discord.js';
import { MV_GUILD } from '../database/models/MV_GUILD';
import { MV_USER } from '../database/models/MV_USER';
import { findMbtiGroupRoles } from '../database/models/MV_ROLE';
import { resolveNewNickname } from './mbtiInteraction';

export async function initMember(member: GuildMember) {
  const { guild, user } = member;

  // Guild must exist before user (FK constraint); roles only need guild to exist
  let mbtiGroupRoles;
  try {
    await MV_GUILD.findOrCreate({ where: { GUILD_ID: guild.id } });
    [, mbtiGroupRoles] = await Promise.all([
      MV_USER.findOrCreate({
        where: { USER_ID: user.id, GUILD_ID: guild.id },
        defaults: { USER_ID: user.id, GUILD_ID: guild.id, MBTI_TYPE: 'NONE' },
      }),
      findMbtiGroupRoles(guild.id),
    ]);
    console.log(`[INIT] DB record created for ${user.id} in guild ${guild.id}`);
  } catch (err) {
    console.error(`[INIT] DB record creation failed for ${user.id} in guild ${guild.id}:`, err);
    return;
  }

  try {
    const noRole = mbtiGroupRoles.find((r) => r.ROLE_NAME.startsWith('NO'));
    if (noRole) {
      await member.roles.add(noRole.ROLE_ID);
      console.log(`[INIT] Role "${noRole.ROLE_NAME}" assigned to ${user.id} in guild ${guild.id}`);
    }
  } catch (err) {
    console.error(`[INIT] Role assignment failed for ${user.id} in guild ${guild.id}:`, err);
  }

  if (guild.ownerId === user.id) {
    console.log(`[INIT] Skipped nickname change for guild owner ${user.id} in guild ${guild.id}`);
    return;
  }

  const newNick = resolveNewNickname(member.nickname, member.displayName, 'BABO', 'NO');
  try {
    await member.setNickname(newNick);
    console.log(`[INIT] Nickname set to "${newNick}" for ${user.id} in guild ${guild.id}`);
  } catch (err) {
    console.error(`[INIT] Nickname set failed for ${user.id} in guild ${guild.id}:`, err);
  }
}
