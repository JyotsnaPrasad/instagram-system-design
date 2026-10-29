import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:8080';

/**
 * Browser tests against the real Spring Boot backend and the Vite dev server.
 * Both are started automatically. The backend uses its own H2 file under
 * backend/target/, so these runs never touch backend/data/. If something is already
 * listening on :8080 or :5173 it is reused (outside CI), and the tests reset its data.
 *
 *   npm run test:e2e      # the test suite
 *   npm run screenshots   # regenerate docs/screenshots/
 */
export default defineConfig({
  testDir: './e2e',
  // The tests share one backend and reset its data, so they run one at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'e2e',
      testIgnore: /screenshots\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'screenshots',
      testMatch: /screenshots\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      name: 'backend',
      command: './mvnw -q spring-boot:run -Dspring-boot.run.arguments=--spring.datasource.url=jdbc:h2:file:./target/e2e-data/insta',
      cwd: '../backend',
      url: `${BACKEND_URL}/api/users`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      name: 'frontend',
      command: 'npm run dev -- --port 5173 --strictPort',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
