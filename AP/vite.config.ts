/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * 只在 build 時於 <head> 注入 CSP meta（plan §FE-2、§CP-3）。
 * dev 不注入，以免擋住 react-refresh 的 inline script。
 * connect-src：VITE_DATA_BASE_URL 為絕對網址時加入其 origin；未設定或為相對路徑時只有 'self'。
 */
function cspPlugin(dataBaseUrl: string | undefined): Plugin {
  const connectSrc = ["'self'"];
  if (dataBaseUrl) {
    try {
      // 相對路徑沒有 base 時會丟錯，視為同源。
      connectSrc.push(new URL(dataBaseUrl).origin);
    } catch {
      // 相對路徑：只用 'self'
    }
  }
  const policy = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "img-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
  ].join('; ');

  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), cspPlugin(env.VITE_DATA_BASE_URL)],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});
