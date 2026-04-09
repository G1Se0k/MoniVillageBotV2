"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userRegister_1 = require("./userRegister");
const role_1 = require("./role");
const mbti_1 = require("./mbti");
const nickname_1 = require("./nickname");
const availableCommands = [userRegister_1.userRegister, role_1.role, mbti_1.mbti, nickname_1.nickname];
exports.default = availableCommands;
