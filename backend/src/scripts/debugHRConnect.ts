import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function debug() {
  await AppDataSource.initialize();

  const tenantId = '0d847335-7af2-4b6d-8de4-78c5b69a97b9';

  // Direct SQL query
  const result = await AppDataSource.query(`
    SELECT
      p."postId",
      p."title",
      p."tenantId",
      p."isDeleted",
      e."firstName",
      e."lastName"
    FROM hr_connect_posts p
    LEFT JOIN employees e ON e."employeeId" = p."authorId"
    WHERE p."tenantId" = $1
    ORDER BY p."createdAt" DESC
  `, [tenantId]);

  console.log('\n=== Direct SQL Query Results ===');
  console.log('Tenant ID:', tenantId);
  console.log('Posts found:', result.length);
  result.forEach((row: any) => {
    console.log(`  - ${row.title} (tenantId: ${row.tenantId}, isDeleted: ${row.isDeleted})`);
  });

  await AppDataSource.destroy();
  process.exit(0);
}

debug();
