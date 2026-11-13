import {defineConfig} from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig({...base,testMatch:'**/mechanism-motion-proof.spec.ts',webServer:{command:'pnpm exec vite --host 127.0.0.1 --port 5191',url:'http://127.0.0.1:5191/qa/motion-proof.html',reuseExistingServer:!process.env.CI,timeout:120000}});
