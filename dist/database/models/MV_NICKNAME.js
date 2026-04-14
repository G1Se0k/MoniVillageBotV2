"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MV_NICKNAME = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../sequelize");
class MV_NICKNAME extends sequelize_1.Model {
}
exports.MV_NICKNAME = MV_NICKNAME;
MV_NICKNAME.init({
    ID: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    USER_ID: {
        type: sequelize_1.DataTypes.STRING(18),
        allowNull: false,
    },
    GUILD_ID: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    NICKNAME: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    CHANGED_AT: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'MV_NICKNAME',
    freezeTableName: true,
    timestamps: false,
    indexes: [
        { name: 'idx_nick_user_guild_at', fields: ['USER_ID', 'GUILD_ID', 'CHANGED_AT'] },
    ],
});
