import type { Page, Locator } from '@playwright/test';
export function mockDirection(page: Page, mode?: string): Promise<void>;
export function openControls(page: Page, navigate?: boolean): Promise<Locator>;
export function landscapeCycle(page: Page, control: Locator): Promise<void>;
