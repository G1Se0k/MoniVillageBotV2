import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize';

interface UserWalletAttributes {
  user_id: string;
  balance: number;
}

export class UserWallet extends Model<UserWalletAttributes, UserWalletAttributes> implements UserWalletAttributes {
  public user_id!: string;
  public balance!: number;
}

UserWallet.init(
  {
    user_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      comment: 'Discord User ID',
    },
    balance: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '보유 코인 수량',
    },
  },
  {
    sequelize,
    tableName: 'user_wallets',
    freezeTableName: true,
    timestamps: false,
  },
);
