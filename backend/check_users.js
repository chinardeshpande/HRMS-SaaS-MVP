const { createConnection } = require('typeorm');

async function checkUsers() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'hrms_saas',
    });

    const users = await connection.query('SELECT email, role, "isActive" FROM "user" ORDER BY email LIMIT 10');
    console.log('Users in database:');
    console.table(users);

    await connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();
