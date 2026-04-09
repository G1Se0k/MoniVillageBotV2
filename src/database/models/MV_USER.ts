import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface UserAttributes {
  USER_ID: string;
  GUILD_ID: string;
  MBTI_TYPE: string;
}

interface UserCreationAttributes {
  USER_ID: string;
  GUILD_ID: string;
  MBTI_TYPE?: string;
}

export class MV_USER extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public USER_ID!: string;
  public GUILD_ID!: string;
  public MBTI_TYPE!: string;
}

MV_USER.init(
  {
    USER_ID: {
      type: DataTypes.STRING(18),
      primaryKey: true,
    },
    GUILD_ID: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    MBTI_TYPE: {
      type: DataTypes.STRING(4),
      allowNull: false,
      defaultValue: 'NONE',
    },
  },
  {
    sequelize,
    tableName: 'MV_USER',
    freezeTableName: true,
    timestamps: false,
  },
);