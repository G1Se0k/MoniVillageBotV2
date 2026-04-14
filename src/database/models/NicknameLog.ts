import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface NicknameLogAttributes {
  id: number;
  user_id: string;
  guild_id: string;
  nickname: string;
  created_at: Date;
}

interface NicknameLogCreationAttributes {
  user_id: string;
  guild_id: string;
  nickname: string;
}

export class NicknameLog extends Model<NicknameLogAttributes, NicknameLogCreationAttributes> implements NicknameLogAttributes {
  public id!: number;
  public user_id!: string;
  public guild_id!: string;
  public nickname!: string;
  public created_at!: Date;
}

NicknameLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    guild_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'nickname_logs',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      { name: 'idx_nickname_logs_user_guild', fields: ['user_id', 'guild_id', 'created_at'] },
    ],
  },
);
