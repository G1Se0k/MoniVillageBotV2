import { initRelations } from './relations';
import { sequelize } from './sequelize';

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    initRelations();
    await sequelize.sync({ alter: true });
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}
