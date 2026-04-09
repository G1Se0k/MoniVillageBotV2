import { DataTypes, Model, Op } from 'sequelize';
import { sequelize } from '../sequelize';
import { MBTI_ROLE_PREFIXES, MbtiRolePrefix } from '../../constants/mbti';

export { MbtiRolePrefix };

interface RoleAttributes {
  ROLE_ID: string;
  GUILD_ID: string;
  ROLE_NAME: string;
}

export class MV_ROLE extends Model<RoleAttributes, RoleAttributes> implements RoleAttributes {
  public ROLE_ID!: string;
  public GUILD_ID!: string;
  public ROLE_NAME!: string;
}

MV_ROLE.init(
  {
    ROLE_ID: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    GUILD_ID: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    ROLE_NAME: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'MV_ROLE',
    freezeTableName: true,
    timestamps: false,
  },
);

export async function findMbtiGroupRoles(guildId: string): Promise<MV_ROLE[]> {
  return MV_ROLE.findAll({
    where: {
      GUILD_ID: guildId,
      [Op.or]: MBTI_ROLE_PREFIXES.map((prefix) => ({
        ROLE_NAME: { [Op.startsWith]: prefix },
      })),
    },
  });
}

export async function registerRoleToDb(roleId: string, guildId: string, roleName: string): Promise<MV_ROLE> {
  return MV_ROLE.create({ ROLE_ID: roleId, GUILD_ID: guildId, ROLE_NAME: roleName });
}