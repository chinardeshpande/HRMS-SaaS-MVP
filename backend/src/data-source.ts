import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hrms_dev',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false, // Never auto-sync when running migrations
  logging: true,
  entities: [path.join(__dirname, 'models/*.{js,ts}')],
  // The pre-Cloud-Run migrations are retained under `migrations/` for historical
  // reference, but they were additive-only and assume an auto-synchronized base
  // schema. Fresh Cloud Run environments use the complete v2 baseline instead.
  migrations: [path.join(__dirname, 'migrations-v2/*.{js,ts}')],
  subscribers: [],
});
