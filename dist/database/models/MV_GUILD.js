"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MV_GUILD = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../sequelize");
class MV_GUILD extends sequelize_1.Model {
}
exports.MV_GUILD = MV_GUILD;
MV_GUILD.init({
    GUILD_ID: {
        type: sequelize_1.DataTypes.STRING(20),
        primaryKey: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'MV_GUILD',
    freezeTableName: true,
    timestamps: false,
});
