export const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
  'NONE',
] as const;

export const MBTI_TYPE_SET = new Set<string>([...MBTI_TYPES, 'BABO']);

export type MbtiType = (typeof MBTI_TYPES)[number];

export const MBTI_ROLE_PREFIXES = ['IS', 'IN', 'ES', 'EN', 'NO'] as const;
export type MbtiRolePrefix = (typeof MBTI_ROLE_PREFIXES)[number];

export const CUSTOM_IDS = {
  MBTI_SELECT: 'mbti_select',
  NICKNAME_MODAL: 'nickname_modal',
  NICKNAME_INPUT: 'nickname_input',
} as const;

export const BOT_NICK_REGEX = /^\S+ .+\/[A-Z]{4} \S+$/;

// 닉네임에서 MBTI/커스텀 타입 슬롯을 추출하는 정규식
export const NICK_TYPE_REGEX = /\/([A-Z]{4})\s/;

// 닉네임 변경 쿨다운
export const COOLDOWN_DAYS = 7;
export const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// MBTI 그룹별 이모지
export const GROUP_EMOJIS: Record<MbtiRolePrefix, string> = {
  IS: '🟩',
  IN: '🟦',
  ES: '🟥',
  EN: '🟧',
  NO: '⬛',
};
