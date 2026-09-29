import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { env } from '../config/env';

export const DB_TESTS_ENABLED = process.env.RUN_DB_TESTS === '1';

const databaseName = (url: string): string => {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return 'unknown';
  }
};

if (DB_TESTS_ENABLED) {
  console.warn(
    `[db-tests] ENABLED — the suites run against "${databaseName(env.DATABASE_URL)}" and ` +
      'truncate every table between tests. Restore the demo data afterwards with ' +
      '`npm run seed -w backend`.',
  );
}

/**
 * The services resolve their repositories from `AppDataSource`, so the suites
 * initialise that same connection rather than a second one: a separate test
 * DataSource would leave the service layer querying through an uninitialised
 * connection.
 *
 * `RUN_DB_TESTS=1` is the explicit opt-in (`npm run test:db -w backend`).
 * Without it the DB suites are skipped, and `truncateTables` refuses to run —
 * they are destructive by nature, and this is the development database.
 */
export const testDataSource = AppDataSource;

/**
 * The suites assert behaviour against the schema that is already in the
 * database; they never migrate it. Migration files are TypeScript, and TypeORM
 * loads them with `require()` during `initialize()`, which cannot work under
 * the test runner, so the glob is dropped for the test connection.
 */
testDataSource.setOptions({ migrations: [], migrationsRun: false });

