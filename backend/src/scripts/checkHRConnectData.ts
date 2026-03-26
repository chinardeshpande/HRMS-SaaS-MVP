import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { HRConnectPost } from '../models/HRConnectPost';
import { HRConnectGroup } from '../models/HRConnectGroup';
import { Tenant } from '../models/Tenant';

async function check() {
  await AppDataSource.initialize();

  const tenantRepo = AppDataSource.getRepository(Tenant);
  const postRepo = AppDataSource.getRepository(HRConnectPost);
  const groupRepo = AppDataSource.getRepository(HRConnectGroup);

  const tenant = await tenantRepo.findOne({ where: { subdomain: 'acme' } });
  console.log('Tenant ID:', tenant?.tenantId);

  const posts = await postRepo.find({
    where: { tenantId: tenant!.tenantId },
    relations: ['author', 'group']
  });

  console.log('\n📋 Posts:', posts.length);
  posts.forEach(p => console.log('  -', p.title, '| by:', p.author?.firstName, p.author?.lastName));

  const groups = await groupRepo.find({
    where: { tenantId: tenant!.tenantId }
  });

  console.log('\n👥 Groups:', groups.length);
  groups.forEach(g => console.log('  -', g.name, '| members:', g.memberCount));

  await AppDataSource.destroy();
  process.exit(0);
}

check();
