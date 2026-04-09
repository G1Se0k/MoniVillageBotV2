"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRelations = void 0;
const MV_GUILD_1 = require("./models/MV_GUILD");
const MV_USER_1 = require("./models/MV_USER");
const MV_ROLE_1 = require("./models/MV_ROLE");
const MV_MBTI_1 = require("./models/MV_MBTI");
const MV_NICKNAME_1 = require("./models/MV_NICKNAME");
let initialized = false;
const initRelations = () => {
    if (initialized)
        return;
    initialized = true;
    MV_GUILD_1.MV_GUILD.hasMany(MV_USER_1.MV_USER, { foreignKey: 'GUILD_ID', sourceKey: 'GUILD_ID', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    MV_USER_1.MV_USER.belongsTo(MV_GUILD_1.MV_GUILD, { foreignKey: 'GUILD_ID', targetKey: 'GUILD_ID' });
    MV_GUILD_1.MV_GUILD.hasMany(MV_ROLE_1.MV_ROLE, { foreignKey: 'GUILD_ID', sourceKey: 'GUILD_ID', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    MV_ROLE_1.MV_ROLE.belongsTo(MV_GUILD_1.MV_GUILD, { foreignKey: 'GUILD_ID', targetKey: 'GUILD_ID' });
    MV_GUILD_1.MV_GUILD.hasMany(MV_MBTI_1.MV_MBTI, { foreignKey: 'GUILD_ID', sourceKey: 'GUILD_ID', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    MV_MBTI_1.MV_MBTI.belongsTo(MV_GUILD_1.MV_GUILD, { foreignKey: 'GUILD_ID', targetKey: 'GUILD_ID' });
    MV_GUILD_1.MV_GUILD.hasMany(MV_NICKNAME_1.MV_NICKNAME, { foreignKey: 'GUILD_ID', sourceKey: 'GUILD_ID', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    MV_NICKNAME_1.MV_NICKNAME.belongsTo(MV_GUILD_1.MV_GUILD, { foreignKey: 'GUILD_ID', targetKey: 'GUILD_ID' });
};
exports.initRelations = initRelations;
