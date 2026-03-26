import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { hrConnectService } from '../services/hrConnectService';

async function test() {
  await AppDataSource.initialize();

  const tenantId = '0d847335-7af2-4b6d-8de4-78c5b69a97b9';

  console.log('\n=== Testing HRConnectService.getAllPosts ===');
  console.log('Tenant ID:', tenantId);

  const result = await hrConnectService.getAllPosts(tenantId, {});

  console.log('\nResult:', {
    total: result.total,
    postCount: result.posts.length,
    posts: result.posts.map(p => ({
      title: p.title,
      author: p.author ? `${p.author.firstName} ${p.author.lastName}` : 'No author'
    }))
  });

  await AppDataSource.destroy();
  process.exit(0);
}

test();
