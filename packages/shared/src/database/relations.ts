import { Guild } from './models/Guild';
import { Member } from './models/Member';
import { Role } from './models/Role';

let initialized = false;

export const initRelations = () => {
  if (initialized) return;
  initialized = true;

  // guilds → members (guild 삭제 시 소속 멤버 전체 삭제)
  Guild.hasMany(Member, { foreignKey: 'guild_id', sourceKey: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Member.belongsTo(Guild, { foreignKey: 'guild_id', targetKey: 'id' });

  // guilds → roles (guild 삭제 시 소속 역할 전체 삭제)
  Guild.hasMany(Role, { foreignKey: 'guild_id', sourceKey: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Role.belongsTo(Guild, { foreignKey: 'guild_id', targetKey: 'id' });

  // mbti_logs, nickname_logs는 members의 복합 PK(user_id, guild_id)를 참조해야 하나
  // Sequelize가 복합 FK를 지원하지 않아 연관관계 대신 인덱스로 처리
};
