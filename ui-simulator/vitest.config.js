import { defineConfig } from 'vitest/config';
import path from 'path';

const here = import.meta.dirname;
const workspaceRoot = path.resolve(here, '..');

export default defineConfig({
  // Os testes importam os .otui reais do repositorio do cliente (fora da raiz do Vite), entao a
  // leitura precisa ser liberada explicitamente -- e o mesmo allow do vite.config.js.
  server: {
    fs: {
      allow: [workspaceRoot],
      strict: false,
    },
  },
  test: {
    // A UI e DOM puro: os testes de widget precisam de document/window.
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
    globals: false,
  },
  resolve: {
    alias: {
      '@images': path.resolve(here, '../client/data/images'),
      '@src': path.resolve(here, 'src'),
    },
  },
});
