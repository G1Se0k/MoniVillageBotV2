import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface MBTIAttributes {
  ID: number;
  USER_ID: string;
  GUILD_ID: string;
  MBTI_TYPE: string;
  SELECTED_AT: Date;
}

interface MBTICreationAttributes {
  USER_ID: string;
  GUILD_ID: string;
  MBTI_TYPE: string;
}

export class MV_MBTI extends Model<MBTIAttributes, MBTICreationAttributes> implements MBTIAttributes {
  public ID!: number;
  public USER_ID!: string;
  public GUILD_ID!: string;
  public MBTI_TYPE!: string;
  public SELECTED_AT!: Date;
}

MV_MBTI.init(
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    USER_ID: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    GUILD_ID: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    MBTI_TYPE: {
      type: DataTypes.STRING(4),
      allowNull: false,
    },
    SELECTED_AT: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'MV_MBTI',
    freezeTableName: true,
    timestamps: false,
  },
);