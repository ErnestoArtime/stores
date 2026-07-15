import { defineConfig } from 'vite';
import { resolve } from 'path';

const baseDir = new URL('.', import.meta.url).pathname;

export default defineConfig({
  cacheDir: '../../node_modules/.vite/libs/data-access',
  resolve: {
    alias: {
      '@stores/domain': resolve(baseDir, '../domain/src/index.ts')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    root: baseDir,
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: [resolve(baseDir, 'src/test-setup.ts')]
  }
});
