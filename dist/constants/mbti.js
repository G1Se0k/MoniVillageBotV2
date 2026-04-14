"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROUP_EMOJIS = exports.COOLDOWN_MS = exports.COOLDOWN_DAYS = exports.NICK_TYPE_REGEX = exports.BOT_NICK_REGEX = exports.CUSTOM_IDS = exports.MBTI_ROLE_PREFIXES = exports.MBTI_TYPE_SET = exports.MBTI_TYPES = void 0;
exports.MBTI_TYPES = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
    'NONE',
];
exports.MBTI_TYPE_SET = new Set([...exports.MBTI_TYPES, 'BABO']);
exports.MBTI_ROLE_PREFIXES = ['IS', 'IN', 'ES', 'EN', 'NO'];
exports.CUSTOM_IDS = {
    MBTI_SELECT: 'mbti_select',
    NICKNAME_MODAL: 'nickname_modal',
    NICKNAME_INPUT: 'nickname_input',
};
exports.BOT_NICK_REGEX = /^\S+ .+\/[A-Z]{4} \S+$/;
// 닉네임에서 MBTI/커스텀 타입 슬롯을 추출하는 정규식
exports.NICK_TYPE_REGEX = /\/([A-Z]{4})\s/;
// 닉네임 변경 쿨다운
exports.COOLDOWN_DAYS = 7;
exports.COOLDOWN_MS = exports.COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
// MBTI 그룹별 이모지
exports.GROUP_EMOJIS = {
    IS: '🟩',
    IN: '🟦',
    ES: '🟥',
    EN: '🟧',
    NO: '⬛',
};
