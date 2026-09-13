import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface MbtiLogAttributes {
  id: number;
  user_id: string;
  guild_id: string;
  mbti_type: string;
  created_at: Date;
}

interface MbtiLogCreationAttributes {
  user_id: string;
  guild_id: string;
  mbti_type: string;
}

export class MbtiLog extends Model<MbtiLogAttributes, MbtiLogCreationAttributes> implements MbtiLogAttributes {
  public id!: number;
  public user_id!: string;
  public guild_id!: string;
  public mbti_type!: string;
  public created_at!: Date;
}

MbtiLog.init(
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
    mbti_type: {
      type: DataTypes.STRING(4),
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
    tableName: 'mbti_logs',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      { name: 'idx_mbti_logs_user_guild', fields: ['user_id', 'guild_id', 'created_at'] },
    ],
  },
);
