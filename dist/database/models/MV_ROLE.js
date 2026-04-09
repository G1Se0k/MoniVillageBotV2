"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MV_ROLE = void 0;
exports.findMbtiGroupRoles = findMbtiGroupRoles;
exports.registerRoleToDb = registerRoleToDb;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../sequelize");
const mbti_1 = require("../../constants/mbti");
class MV_ROLE extends sequelize_1.Model {
}
exports.MV_ROLE = MV_ROLE;
MV_ROLE.init({
    ROLE_ID: {
        type: sequelize_1.DataTypes.STRING(20),
        primaryKey: true,
    },
    GUILD_ID: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    ROLE_NAME: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'MV_ROLE',
    freezeTableName: true,
    timestamps: false,
});
function findMbtiGroupRoles(guildId) {
    return __awaiter(this, void 0, void 0, function* () {
        return MV_ROLE.findAll({
            where: {
                GUILD_ID: guildId,
                [sequelize_1.Op.or]: mbti_1.MBTI_ROLE_PREFIXES.map((prefix) => ({
                    ROLE_NAME: { [sequelize_1.Op.startsWith]: prefix },
                })),
            },
        });
    });
}
function registerRoleToDb(roleId, guildId, roleName) {
    return __awaiter(this, void 0, void 0, function* () {
        return MV_ROLE.create({ ROLE_ID: roleId, GUILD_ID: guildId, ROLE_NAME: roleName });
    });
}
