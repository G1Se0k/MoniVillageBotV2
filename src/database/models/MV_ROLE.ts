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
    indexes: [
      { name: 'idx_role_guild', fields: ['GUILD_ID'] },
      { name: 'idx_role_guild_name', fields: ['GUILD_ID', 'ROLE_NAME'] },
    ],
  },
);

// In-memory cache for MBTI group roles per guild (TTL: 5 minutes)
const ROLE_CACHE_TTL = 5 * 60 * 1000;
const mbtiRoleCache = new Map<string, { roles: MV_ROLE[]; expiresAt: number }>();

export async function findMbtiGroupRoles(guildId: string): Promise<MV_ROLE[]> {
  const cached = mbtiRoleCache.get(guildId);
  if (cached && cached.expiresAt > Date.now()) return cached.roles;

  const roles = await MV_ROLE.findAll({
    where: {
      GUILD_ID: guildId,
      [Op.or]: MBTI_ROLE_PREFIXES.map((prefix) => ({
        ROLE_NAME: { [Op.startsWith]: prefix },
      })),
    },
  });

  mbtiRoleCache.set(guildId, { roles, expiresAt: Date.now() + ROLE_CACHE_TTL });
  return roles;
}

export function invalidateMbtiRoleCache(guildId: string): void {
  mbtiRoleCache.delete(guildId);
}

export async function registerRoleToDb(roleId: string, guildId: string, roleName: string): Promise<MV_ROLE> {
  return MV_ROLE.create({ ROLE_ID: roleId, GUILD_ID: guildId, ROLE_NAME: roleName });
}
