export const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
  'NONE',
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];

export const MBTI_ROLE_PREFIXES = ['IS', 'IN', 'ES', 'EN', 'NO'] as const;
export type MbtiRolePrefix = (typeof MBTI_ROLE_PREFIXES)[number];

export const CUSTOM_IDS = {
  MBTI_SELECT: 'mbti_select',
  NICKNAME_MODAL: 'nickname_modal',
  NICKNAME_INPUT: 'nickname_input',
} as const;

export const BOT_NICK_REGEX = /^\S+ .+\/[A-Z]{4} \S+$/;
