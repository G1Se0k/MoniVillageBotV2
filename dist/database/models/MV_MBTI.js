"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MV_MBTI = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../sequelize");
class MV_MBTI extends sequelize_1.Model {
}
exports.MV_MBTI = MV_MBTI;
MV_MBTI.init({
    ID: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    USER_ID: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    GUILD_ID: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    MBTI_TYPE: {
        type: sequelize_1.DataTypes.STRING(4),
        allowNull: false,
    },
    SELECTED_AT: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'MV_MBTI',
    freezeTableName: true,
    timestamps: false,
    indexes: [
        { name: 'idx_mbti_user_guild_at', fields: ['USER_ID', 'GUILD_ID', 'SELECTED_AT'] },
    ],
});
