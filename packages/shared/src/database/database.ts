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

async function seedItems() {
  await Item.findOrCreate({
    where: { code: 'custom_mbti' },
    defaults: {
      code: 'custom_mbti',
      name: '커스텀 MBTI 이용권',
      category: 'feature',
      price: 500,
      payload: {},
      active: true,
    },
  });
}
