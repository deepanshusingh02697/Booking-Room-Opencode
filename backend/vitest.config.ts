import { defineConfig } from 'vitest/config';
import path from 'path';
import swc from 'unplugin-swc';

export default defineConfig({
  // esbuild (Vite's default transform) does not emit the decorator metadata
  // (`design:type`, `design:paramtypes`) that TypeORM entities and type-graphql
  // resolvers require — without it the whole suite fails with
  // `ColumnTypeUndefinedError`. SWC emits it; `unplugin-swc` infers the needed
  // options from tsconfig (emitDecoratorMetadata, experimentalDecorators).
  plugins: [swc.vite()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    passWithNoTests: true,
    isolate: true,
  },
});