import { defineConfig } from '@playwright/test';

// Explicit local review; intentionally absent from the remote CI matrix.
export default defineConfig({
  testDir: './tests/browser', testMatch: ['immersive-race-ui.spec.ts', 'chat-layout.spec.ts'],
  outputDir: '.local/race-ui-webkit-results', timeout: 120000, expect: { timeout: 10000 },
  workers: 1, retries: 0, reporter: 'list',
  use: { headless: true, deviceScaleFactor: 1, screenshot: 'only-on-failure' },
  projects: [{ name: 'webkit', use: { browserName: 'webkit' } }],
});
