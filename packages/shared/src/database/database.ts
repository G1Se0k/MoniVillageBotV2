import { initRelations } from './relations';
import { sequelize } from './sequelize';
import { Item } from './models/Item';

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    initRelations();
    // ponytail: prod은 migration 도구 도입 시까지 sync만; alter는 dev 편의용
    const alter = process.env.NODE_ENV !== 'production';
    await sequelize.sync(alter ? { alter: true } : {});
    await seedItems();
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

const SEED_ITEMS = [
  { code: 'custom_mbti', name: '커스텀 MBTI 이용권', category: 'feature', price: 500, payload: {} },
  { code: 'symbol_red_square', name: '🟥 빨강 사각', category: 'nickname_symbol', price: 100, payload: { symbol: '🟥' } },
  { code: 'symbol_green_square', name: '🟩 초록 사각', category: 'nickname_symbol', price: 100, payload: { symbol: '🟩' } },
  { code: 'symbol_blue_square', name: '🟦 파랑 사각', category: 'nickname_symbol', price: 100, payload: { symbol: '🟦' } },
  { code: 'symbol_orange_square', name: '🟧 주황 사각', category: 'nickname_symbol', price: 100, payload: { symbol: '🟧' } },
  { code: 'symbol_black_square', name: '⬛ 검정 사각', category: 'nickname_symbol', price: 100, payload: { symbol: '⬛' } },
  { code: 'symbol_blue_diamond', name: '🔷 파랑 다이아', category: 'nickname_symbol', price: 100, payload: { symbol: '🔷' } },
  { code: 'symbol_white_square', name: '⬜ 흰색 사각', category: 'nickname_symbol', price: 100, payload: { symbol: '⬜' } },
];

async function seedItems() {
  for (const seed of SEED_ITEMS) {
    await Item.findOrCreate({
      where: { code: seed.code },
      defaults: { ...seed, active: true },
    });
  }
}
