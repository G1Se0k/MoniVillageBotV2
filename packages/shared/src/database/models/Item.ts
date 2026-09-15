import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface ItemAttributes {
  id: number;
  code: string;
  name: string;
  category: string;
  price: number;
  payload: Record<string, unknown>;
  active: boolean;
}

interface ItemCreationAttributes {
  code: string;
  name: string;
  category: string;
  price: number;
  payload?: Record<string, unknown>;
  active?: boolean;
}

export class Item extends Model<ItemAttributes, ItemCreationAttributes> implements ItemAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public category!: string;
  public price!: number;
  public payload!: Record<string, unknown>;
  public active!: boolean;
}

Item.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '아이템 고유 코드',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(32),
      allowNull: false,
      comment: 'nickname | embed | ...',
    },
    price: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'KRW',
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: '카테고리별 꾸미기 데이터',
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Item',
    tableName: 'items',
    freezeTableName: true,
    timestamps: false,
    indexes: [
      { name: 'idx_items_category_active', fields: ['category', 'active'] },
    ],
  },
);
