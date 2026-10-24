import { defineConfig } from '@playwright/test';
// Dedicated authoring/visual review build only. Normal production tests do not
// require or expose the private-in-page scene observation hook.
process.env.SCULPT_QA = '1';
const software = process.env.SCULPT_SOFTWARE === '1';
export default defineConfig({
  testDir: './tests/browser',
  testMatch: ['sculpt-complete.spec.ts', 'sculpt-roster.spec.ts', 'sculpt-forms.spec.ts', 'model-quality-recovery.spec.ts'],
  workers: 1, retries: 0, timeout: 120_000, expect: { timeout: 30_000 }, reporter: 'list',
  use: { headless: true, deviceScaleFactor: 1,
    channel: process.platform === 'win32' && !process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? 'msedge' : undefined,
    launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: software ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] : undefined,
  } },
});
