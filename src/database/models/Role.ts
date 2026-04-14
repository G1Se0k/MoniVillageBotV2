import { DataTypes, Model, Op } from 'sequelize';
import { sequelize } from '../sequelize';
import { MBTI_ROLE_PREFIXES, MbtiRolePrefix } from '../../constants/mbti';

export { MbtiRolePrefix };

interface RoleAttributes {
  role_id: string;
  guild_id: string;
  name: string;
}

export class Role extends Model<RoleAttributes, RoleAttributes> implements RoleAttributes {
  public role_id!: string;
  public guild_id!: string;
  public name!: string;
}

Role.init(
  {
    role_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      comment: 'Discord Role ID',
    },
    guild_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Discord Guild ID',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'roles',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      { name: 'idx_roles_guild', fields: ['guild_id'] },
      { name: 'idx_roles_guild_name', fields: ['guild_id', 'name'] },
    ],
  },
);

// In-memory cache for MBTI group roles per guild (TTL: 5 minutes)
const ROLE_CACHE_TTL = 5 * 60 * 1000;
const mbtiRoleCache = new Map<string, { roles: Role[]; expiresAt: number }>();

export async function findMbtiGroupRoles(guildId: string): Promise<Role[]> {
  const cached = mbtiRoleCache.get(guildId);
  if (cached && cached.expiresAt > Date.now()) return cached.roles;

  const roles = await Role.findAll({
    where: {
      guild_id: guildId,
      [Op.or]: MBTI_ROLE_PREFIXES.map((prefix) => ({
        name: { [Op.startsWith]: prefix },
      })),
    },
  });

  mbtiRoleCache.set(guildId, { roles, expiresAt: Date.now() + ROLE_CACHE_TTL });
  return roles;
}

export function invalidateMbtiRoleCache(guildId: string): void {
  mbtiRoleCache.delete(guildId);
}

export async function registerRoleToDb(roleId: string, guildId: string, roleName: string): Promise<Role> {
  return Role.create({ role_id: roleId, guild_id: guildId, name: roleName });
}
