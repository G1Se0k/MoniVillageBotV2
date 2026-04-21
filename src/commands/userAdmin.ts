import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed, warnEmbed } from '../utils/embed';
import { Op } from 'sequelize';
import { SlashCommand } from '../types/slashCommand';
import { Member } from '../database/models/Member';
import { MbtiLog } from '../database/models/MbtiLog';
import { NicknameLog } from '../database/models/NicknameLog';
import { findMbtiGroupRoles } from '../database/models/Role';
import { Guild } from '../database/models/Guild';
import { MBTI_TYPES, COOLDOWN_MS } from '../constants/mbti';
import { applyMbtiRoleAndNick, mbtiTypeToPrefix, resolveDisplayType, resolveNewNickname } from '../interactions/mbtiUtils';

export const userAdmin: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('유저관리')
    .setDescription('유저 관련 관리자 기능입니다.')
    .addSubcommand((sub) =>
      sub
        .setName('강제닉변경')
        .setDescription('특정 유저의 닉네임을 강제 변경합니다.')
        .addUserOption((opt) => opt.setName('유저').setDescription('닉네임을 변경할 유저').setRequired(true))
        .addStringOption((opt) =>
          opt.setName('닉네임').setDescription('변경할 닉네임 (2글자)').setMinLength(2).setMaxLength(2).setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('닉쿨다운리셋')
        .setDescription('특정 유저의 닉네임 변경 쿨다운을 초기화합니다.')
        .addUserOption((opt) => opt.setName('유저').setDescription('쿨다운을 리셋할 유저').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('mbti강제설정')
        .setDescription('특정 유저의 MBTI를 강제 설정합니다.')
        .addUserOption((opt) => opt.setName('유저').setDescription('MBTI를 설정할 유저').setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('유형')
            .setDescription('설정할 MBTI 유형')
            .setRequired(true)
            .addChoices(...MBTI_TYPES.map((t) => ({ name: t, value: t }))),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  execute: async (_, interaction) => {
    const { guild } = interaction;
    if (!guild) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === '닉쿨다운리셋') {
      const target = interaction.options.getUser('유저', true);
      const since = new Date(Date.now() - COOLDOWN_MS);

      const deleted = await NicknameLog.destroy({
        where: { user_id: target.id, guild_id: guild.id, created_at: { [Op.gte]: since } },
      });

      if (deleted === 0) {
        await interaction.editReply({ embeds: [warnEmbed(`${target}의 닉네임 쿨다운이 이미 만료되었거나 변경 이력이 없습니다.`)] });
      } else {
        await interaction.editReply({ embeds: [successEmbed(`${target}의 닉네임 변경 쿨다운을 초기화했습니다.`)] });
        console.log(`[ADMIN] Cooldown reset for ${target.id} in guild ${guild.id} by ${interaction.user.id}`);
      }
      return;
    }

    if (subcommand === '강제닉변경') {
      const targetUser = interaction.options.getUser('유저', true);
      const newName = interaction.options.getString('닉네임', true);

      if (guild.ownerId === targetUser.id) {
        await interaction.editReply({ embeds: [warnEmbed('서버 소유자는 봇이 닉네임을 변경할 수 없습니다.')] });
        return;
      }

      const [userRecord, member] = await Promise.all([
        Member.findOne({ where: { user_id: targetUser.id, guild_id: guild.id } }),
        guild.members.fetch(targetUser.id),
      ]);

      const mbtiType = userRecord?.mbti_type ?? 'NONE';
      const prefix = mbtiTypeToPrefix(mbtiType);
      const displayType = resolveDisplayType(member.nickname, member.displayName, mbtiType);
      const newNick = resolveNewNickname(member.nickname, member.displayName, displayType, prefix, newName);

      try {
        await Promise.all([
          member.setNickname(newNick),
          NicknameLog.create({ user_id: targetUser.id, guild_id: guild.id, nickname: newNick }),
        ]);
        await interaction.editReply({ embeds: [successEmbed(`${targetUser}의 닉네임이 **${newNick}**(으)로 변경되었습니다.`)] });
        console.log(`[ADMIN] Nickname force-changed to "${newNick}" for ${targetUser.id} in guild ${guild.id} by ${interaction.user.id}`);
      } catch (err) {
        console.error(`[ADMIN] Force nickname change failed for ${targetUser.id}:`, err);
        await interaction.editReply({ embeds: [errorEmbed('닉네임 변경에 실패했습니다. 봇의 권한을 확인해주세요.')] });
      }
      return;
    }

    if (subcommand === 'mbti강제설정') {
      const targetUser = interaction.options.getUser('유저', true);
      const selectedType = interaction.options.getString('유형', true);

      await Guild.findOrCreate({ where: { id: guild.id } });

      const [mbtiGroupRoles, , , member] = await Promise.all([
        findMbtiGroupRoles(guild.id),
        MbtiLog.create({ user_id: targetUser.id, guild_id: guild.id, mbti_type: selectedType }),
        Member.upsert({ user_id: targetUser.id, guild_id: guild.id, mbti_type: selectedType }),
        guild.members.fetch(targetUser.id),
      ]);

      try {
        const result = await applyMbtiRoleAndNick(guild, member, mbtiGroupRoles, selectedType);
        const lines = [`${targetUser}의 MBTI가 **${selectedType}**(으)로 설정되었습니다.`];
        if (result.roleAssigned && result.roleName) lines.push(`**${result.roleName}** 역할이 부여되었습니다.`);
        if (guild.ownerId === targetUser.id) lines.push('⚠️ 서버 소유자는 닉네임을 직접 변경해야 합니다.');
        await interaction.editReply({ embeds: [successEmbed(lines.join('\n'))] });
        console.log(`[ADMIN] MBTI force-set to ${selectedType} for ${targetUser.id} in guild ${guild.id} by ${interaction.user.id}`);
      } catch (err) {
        console.error(`[ADMIN] MBTI force-set failed for ${targetUser.id}:`, err);
        await interaction.editReply({ embeds: [errorEmbed('MBTI 설정에 실패했습니다. 봇의 권한을 확인해주세요.')] });
      }
    }
  },
};
