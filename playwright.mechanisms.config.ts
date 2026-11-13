import {defineConfig} from '@playwright/test';
import base from './playwright.config.js';
/** Existing official Playwright Chromium/CI software-renderer configuration.
 * This serves the real local engine/Board3D harness; it publishes nothing. */
export default defineConfig({...base,testMatch:'**/map-mechanisms.spec.ts',webServer:{command:'pnpm exec vite --host 127.0.0.1 --port 5186',url:'http://127.0.0.1:5186/qa/mechanisms.html',reuseExistingServer:!process.env.CI,timeout:120000}});
