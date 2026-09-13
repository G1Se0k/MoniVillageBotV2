import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface UserItemAttributes {
  id: number;
  user_id: string;
  item_id: number;
  equipped: boolean;
  acquired_at: Date;
}

interface UserItemCreationAttributes {
  user_id: string;
  item_id: number;
  equipped?: boolean;
}

export class UserItem extends Model<UserItemAttributes, UserItemCreationAttributes> implements UserItemAttributes {
  public id!: number;
  public user_id!: string;
  public item_id!: number;
  public equipped!: boolean;
  public acquired_at!: Date;
}

UserItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Discord User ID',
    },
    item_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    equipped: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      // ponytail: 카테고리당 1개 장착 제약은 앱 레벨에서 처리, DB partial index 필요 시 후속
    },
    acquired_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_items',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      { name: 'uniq_user_item', unique: true, fields: ['user_id', 'item_id'] },
      { name: 'idx_user_items_user', fields: ['user_id'] },
    ],
  },
);
