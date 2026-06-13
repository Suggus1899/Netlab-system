import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/prisma/**'],
    },
  },
  resolve: {
    alias: {
      '@si-learning/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
