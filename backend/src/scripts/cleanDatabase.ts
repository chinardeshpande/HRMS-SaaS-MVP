import { DataSource } from 'typeorm';
import { config } from '../config/config';

async function cleanDatabase() {
  try {
    // Create a simple connection without entities or synchronize
    const dataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      username: config.database.user,
      password: config.database.password,
      database: config.database.name,
    });

    await dataSource.initialize();
    console.log('✅ Database connected');

    console.log('🗑️  Dropping all tables...');

    await dataSource.query('DROP SCHEMA public CASCADE;');
    await dataSource.query('CREATE SCHEMA public;');
    await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    console.log('✅ Database cleaned successfully');

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
