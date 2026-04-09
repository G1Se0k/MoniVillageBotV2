import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface NicknameAttributes {
  ID: number;
  USER_ID: string;
  GUILD_ID: string;
  NICKNAME: string;
  CHANGED_AT: Date;
}

interface NicknameCreationAttributes {
  USER_ID: string;
  GUILD_ID: string;
  NICKNAME: string;
}

export class MV_NICKNAME extends Model<NicknameAttributes, NicknameCreationAttributes> implements NicknameAttributes {
  public ID!: number;
  public USER_ID!: string;
  public GUILD_ID!: string;
  public NICKNAME!: string;
  public CHANGED_AT!: Date;
}

MV_NICKNAME.init(
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    USER_ID: {
      type: DataTypes.STRING(18),
      allowNull: false,
    },
    GUILD_ID: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    NICKNAME: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    CHANGED_AT: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'MV_NICKNAME',
    freezeTableName: true,
    timestamps: false,
  },
);
