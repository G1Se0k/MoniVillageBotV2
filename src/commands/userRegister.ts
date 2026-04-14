import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { successEmbed } from '../utils/embed';
import { SlashCommand } from '../types/slashCommand';
import { Guild } from '../database/models/Guild';
import { Member } from '../database/models/Member';
import { MBTI_TYPES } from '../constants/mbti';

const MBTI_TYPE_SET = new Set<string>(MBTI_TYPES);

function extractMbtiFromNickname(nickname: string | null, displayName: string): string {
  const source = nickname ?? displayName;
  const match = source.match(/\/([A-Z]{4})\s/);
  if (!match) return 'NONE';
  const type = match[1];
  return MBTI_TYPE_SET.has(type) ? type : 'NONE';
}

export const userRegister: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('유저등록')
    .setDescription('서버의 모든 멤버를 DB에 일괄 등록합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  execute: async (_, interaction: ChatInputCommandInteraction) => {
    const { guild } = interaction;
    if (!guild) return;

    await interaction.editReply({ content: '서버 멤버 전체 등록 중...' });

    const [, guildCreated] = await Guild.findOrCreate({ where: { id: guild.id } });
    if (guildCreated) console.log(`Guild registered: ${guild.id}`);

    const members = await guild.members.fetch();
    const humanMembers = members.filter((m) => !m.user.bot);

    const existingIds = new Set(
      (await Member.findAll({ where: { guild_id: guild.id }, attributes: ['user_id'] })).map((u) => u.user_id),
    );

    const toCreate = humanMembers
      .filter((m) => !existingIds.has(m.id))
      .map((m) => ({
        user_id: m.id,
        guild_id: guild.id,
        mbti_type: extractMbtiFromNickname(m.nickname, m.displayName),
      }));

    if (toCreate.length > 0) {
      await Member.bulkCreate(toCreate, { ignoreDuplicates: true });
    }

    const registered = toCreate.length;
    const skipped = humanMembers.size - registered;

    await interaction.editReply({
      embeds: [successEmbed(`전체 멤버 등록 완료!\n새로 등록: **${registered}명** | 이미 존재: **${skipped}명**`)],
    });
    console.log(`Guild ${guild.id}: bulk user register — new=${registered}, skipped=${skipped}`);
  },
};
