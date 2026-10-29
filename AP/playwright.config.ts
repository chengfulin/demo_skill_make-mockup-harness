import { defineConfig, devices } from '@playwright/test';

// §CP-3：port 與 baseURL 由環境變數提供，不寫死。
const port = Number(process.env.E2E_PORT ?? 4173);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}/`;

const desktop = { width: 1440, height: 900 };

export default defineConfig({
  testDir: 'e2e',
  // 不可用 test-results/ 根目錄：compare 截圖放 test-results/compare/，不能被清掉。
  outputDir: 'test-results/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      // 需 400px 的測試在檔內以 test.use({ viewport: { width: 400, height: 800 } }) 切換。
      name: 'chrome',
      testIgnore: /prototype-compare/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: desktop,
        colorScheme: 'light',
      },
    },
    {
      name: 'compare',
      testMatch: /prototype-compare\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: desktop,
        colorScheme: 'light',
      },
    },
    // 以下三者供 e2e:browsers 以 @demo 抽驗（SC-004、D-6）。
    {
      name: 'webkit',
      testIgnore: /prototype-compare/,
      use: { ...devices['Desktop Safari'], viewport: desktop, colorScheme: 'light' },
    },
    {
      name: 'firefox',
      testIgnore: /prototype-compare/,
      use: { ...devices['Desktop Firefox'], viewport: desktop, colorScheme: 'light' },
    },
    {
      name: 'msedge',
      testIgnore: /prototype-compare/,
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: desktop,
        colorScheme: 'light',
      },
    },
  ],
});
