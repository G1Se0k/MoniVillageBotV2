export const ITEM_CATEGORY_LABEL: Record<string, string> = {
  feature: '기능',
  nickname_symbol: '닉네임 심볼',
};

export const categoryLabel = (cat: string) => ITEM_CATEGORY_LABEL[cat] ?? cat;
