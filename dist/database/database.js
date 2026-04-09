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
exports.connectDatabase = connectDatabase;
const relations_1 = require("./relations");
const sequelize_1 = require("./sequelize");
function connectDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield sequelize_1.sequelize.authenticate();
            (0, relations_1.initRelations)();
            yield sequelize_1.sequelize.sync({ alter: true });
            console.log('Database connected');
        }
        catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    });
}
