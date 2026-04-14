import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface MemberAttributes {
  user_id: string;
  guild_id: string;
  mbti_type: string;
}

interface MemberCreationAttributes {
  user_id: string;
  guild_id: string;
  mbti_type?: string;
}

export class Member extends Model<MemberAttributes, MemberCreationAttributes> implements MemberAttributes {
  public user_id!: string;
  public guild_id!: string;
  public mbti_type!: string;
}

Member.init(
  {
    user_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      comment: 'Discord User ID',
    },
    guild_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      comment: 'Discord Guild ID',
    },
    mbti_type: {
      type: DataTypes.STRING(4),
      allowNull: false,
      defaultValue: 'NONE',
    },
  },
  {
    sequelize,
    tableName: 'members',
    freezeTableName: true,
    timestamps: false,
  },
);
