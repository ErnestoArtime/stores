import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/libs/domain',
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts']
  }
});
