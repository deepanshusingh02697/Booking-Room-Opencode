import 'reflect-metadata';
import { beforeAll, afterAll } from 'vitest';
import { DB_TESTS_ENABLED, testDataSource } from './src/test/data-source';
import { truncateTables } from './src/test/test-utils';

// Plain `npm test` must stay database-free: the suites are destructive, so the
// connection is only opened behind the `RUN_DB_TESTS=1` opt-in.
beforeAll(async () => {
  if (!DB_TESTS_ENABLED || testDataSource.isInitialized) {
    return;
  }
  await testDataSource.initialize();
});

afterAll(async () => {
  if (!DB_TESTS_ENABLED || !testDataSource.isInitialized) {
    return;
  }
  // Leave the database empty so the follow-up `npm run seed -w backend` really
  // restores the demo data — the seed is a no-op while rows are present.
  await truncateTables();
  await testDataSource.destroy();
});
