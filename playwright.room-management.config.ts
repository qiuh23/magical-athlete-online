import { defineConfig } from '@playwright/test';
import dual from './playwright.dual.config.js';

// Explicit local suite; existing CI selections and workflows stay unchanged.
export default defineConfig({
  ...dual, testDir:'./tests/room-management-browser', outputDir:'.local/room-management-browser',
  webServer:Array.isArray(dual.webServer)?dual.webServer.slice(0,1):dual.webServer,
});
