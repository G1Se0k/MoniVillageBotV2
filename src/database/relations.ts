import { MV_GUILD } from './models/MV_GUILD';
import { MV_USER } from './models/MV_USER';
import { MV_ROLE } from './models/MV_ROLE';
import { MV_MBTI } from './models/MV_MBTI';
import { MV_NICKNAME } from './models/MV_NICKNAME';

let initialized = false;

export const initRelations = () => {
  if (initialized) return;
  initialized = true;

  MV_GUILD.hasMany(MV_USER, { foreignKey: 'GUILD_ID', sourceKey: 'GUILD_ID', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  MV_USER.belongsTo(MV_GUILD, { foreignKey: 'GUILD_ID', targetKey: 'GUILD_ID' });

  MV_GUILD.hasMany(MV_ROLE, { foreignKey: 'GUILD_ID', sourceKey: 'GUILD_ID', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  MV_ROLE.belongsTo(MV_GUILD, { foreignKey: 'GUILD_ID', targetKey: 'GUILD_ID' });

  MV_GUILD.hasMany(MV_MBTI, { foreignKey: 'GUILD_ID', sourceKey: 'GUILD_ID', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  MV_MBTI.belongsTo(MV_GUILD, { foreignKey: 'GUILD_ID', targetKey: 'GUILD_ID' });

  MV_GUILD.hasMany(MV_NICKNAME, { foreignKey: 'GUILD_ID', sourceKey: 'GUILD_ID', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  MV_NICKNAME.belongsTo(MV_GUILD, { foreignKey: 'GUILD_ID', targetKey: 'GUILD_ID' });
};