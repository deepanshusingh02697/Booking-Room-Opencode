import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source';

const main = async () => {
  await AppDataSource.initialize();
  const rows = await AppDataSource.query(
    'SELECT name FROM migrations ORDER BY id DESC LIMIT 1',
  );
  const last = rows?.[0]?.name as string | undefined;
  await AppDataSource.undoLastMigration();
  if (!last) {
    console.log('Nothing to revert.');
  } else {
    console.log(`Reverted migration: ${last}`);
  }
  await AppDataSource.destroy();
};

main().catch((err) => {
  console.error('Migration revert failed', err);
  process.exit(1);
});