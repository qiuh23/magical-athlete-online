import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/dual-browser', workers: 1, retries: 0, timeout: 120000,
  expect: {timeout: 15000}, reporter: [['list']],
  use: {
    headless: true, channel: process.platform === 'win32' ? 'msedge' : undefined,
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: {args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--host-resolver-rules=MAP *.http.test 127.0.0.1', '--no-proxy-server']},
  },
  webServer: {
    command: 'node node_modules/wrangler/bin/wrangler.js dev --ip 127.0.0.1 --port 8797 --persist-to .local/dual-worker-state --var PUBLIC_ORIGINS:http://127.0.0.1:3321,http://game.http.test:3322,http://guest.http.test:3322',
    url: 'http://127.0.0.1:8797/api/connectivity', timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
});
