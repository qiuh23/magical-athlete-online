import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/dual-browser', workers: 1, retries: 0, timeout: 120000,
  expect: {timeout: 15000}, reporter: [['list']],
  use: {
    headless: true, channel: process.platform === 'win32' ? 'msedge' : undefined, ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: {args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--host-resolver-rules=MAP *.http.test 127.0.0.1', '--no-proxy-server', '--ignore-certificate-errors']},
  },
  webServer: [{
    command: 'node node_modules/wrangler/bin/wrangler.js dev --ip 127.0.0.1 --port 8797 --local-protocol https --persist-to .local/dual-worker-state --var PUBLIC_ORIGINS:http://127.0.0.1:3321,http://game.http.test:3322,http://guest.http.test:3322',
    url: 'https://127.0.0.1:8797/api/connectivity', ignoreHTTPSErrors: true, timeout: 60000,
    reuseExistingServer: !process.env.CI,
  }, {
    // A separate Worker namespace and state directory stand in for shared Preview.
    command: 'node node_modules/wrangler/bin/wrangler.js dev --ip 127.0.0.1 --port 8798 --inspector-port 9238 --local-protocol https --persist-to .local/dual-preview-worker-state --var MULTIPLAYER_ROOM_LIMIT:1 --var PUBLIC_ORIGINS:http://game.http.test:3323',
    url: 'https://127.0.0.1:8798/api/connectivity', ignoreHTTPSErrors: true, timeout: 60000,
    reuseExistingServer: !process.env.CI,
  }],
});
