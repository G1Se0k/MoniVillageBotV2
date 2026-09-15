import { initRelations } from './relations';
import { sequelize } from './sequelize';
import { Item } from './models/Item';

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    initRelations();
    await sequelize.sync({ alter: true });
    await seedItems();
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

const SEED_ITEMS = [
  { code: 'custom_mbti', name: '커스텀 MBTI 이용권', category: 'feature', price: 500, payload: {} },
  { code: 'symbol_blue_diamond', name: '🔷 파랑 다이아', category: 'nickname_symbol', price: 100, payload: { symbol: '🔷' } },
  { code: 'symbol_orange_square', name: '🟧 주황 사각', category: 'nickname_symbol', price: 100, payload: { symbol: '🟧' } },
  { code: 'symbol_orange_diamond', name: '🔶 주황 다이아', category: 'nickname_symbol', price: 100, payload: { symbol: '🔶' } },
  { code: 'symbol_star', name: '⭐ 별', category: 'nickname_symbol', price: 150, payload: { symbol: '⭐' } },
  { code: 'symbol_sparkle_diamond', name: '💠 반짝 다이아', category: 'nickname_symbol', price: 200, payload: { symbol: '💠' } },
];

async function seedItems() {
  for (const seed of SEED_ITEMS) {
    await Item.findOrCreate({
      where: { code: seed.code },
      defaults: { ...seed, active: true },
    });
  }
}
