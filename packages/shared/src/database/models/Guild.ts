import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface GuildAttributes {
  id: string;
}

export class Guild extends Model<GuildAttributes, GuildAttributes> implements GuildAttributes {
  public id!: string;
}

Guild.init(
  {
    id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      comment: 'Discord Guild ID',
    },
  },
  {
    sequelize,
    tableName: 'guilds',
    freezeTableName: true,
    timestamps: false,
  },
);
