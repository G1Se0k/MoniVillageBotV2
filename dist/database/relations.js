"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRelations = void 0;
const Guild_1 = require("./models/Guild");
const Member_1 = require("./models/Member");
const Role_1 = require("./models/Role");
let initialized = false;
const initRelations = () => {
    if (initialized)
        return;
    initialized = true;
    // guilds → members (guild 삭제 시 소속 멤버 전체 삭제)
    Guild_1.Guild.hasMany(Member_1.Member, { foreignKey: 'guild_id', sourceKey: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Member_1.Member.belongsTo(Guild_1.Guild, { foreignKey: 'guild_id', targetKey: 'id' });
    // guilds → roles (guild 삭제 시 소속 역할 전체 삭제)
    Guild_1.Guild.hasMany(Role_1.Role, { foreignKey: 'guild_id', sourceKey: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
    Role_1.Role.belongsTo(Guild_1.Guild, { foreignKey: 'guild_id', targetKey: 'id' });
    // mbti_logs, nickname_logs는 members의 복합 PK(user_id, guild_id)를 참조해야 하나
    // Sequelize가 복합 FK를 지원하지 않아 연관관계 대신 인덱스로 처리
};
exports.initRelations = initRelations;
