import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface GuildAttributes {
  GUILD_ID: string;
}

export class MV_GUILD extends Model<GuildAttributes, GuildAttributes> implements GuildAttributes {
  public GUILD_ID!: string;
}

MV_GUILD.init(
  {
    GUILD_ID: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: 'MV_GUILD',
    freezeTableName: true,
    timestamps: false,
  },
);