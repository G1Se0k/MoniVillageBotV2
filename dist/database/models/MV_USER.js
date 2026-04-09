"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MV_USER = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../sequelize");
class MV_USER extends sequelize_1.Model {
}
exports.MV_USER = MV_USER;
MV_USER.init({
    USER_ID: {
        type: sequelize_1.DataTypes.STRING(18),
        primaryKey: true,
    },
    GUILD_ID: {
        type: sequelize_1.DataTypes.STRING(20),
        primaryKey: true,
    },
    MBTI_TYPE: {
        type: sequelize_1.DataTypes.STRING(4),
        allowNull: false,
        defaultValue: 'NONE',
    },
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'MV_USER',
    freezeTableName: true,
    timestamps: false,
});
