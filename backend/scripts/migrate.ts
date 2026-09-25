import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source';

const main = async () => {
  await AppDataSource.initialize();
  const ran = await AppDataSource.runMigrations();
  if (ran.length === 0) {
    console.log('No migrations to run.');
  } else {
    console.log(`Migrations run: ${ran.map((m) => m.name).join(', ')}`);
  }
  await AppDataSource.destroy();
};

main().catch((err) => {
  console.error('Migration run failed', err);
  process.exit(1);
});