import type { Locator, Page } from '@playwright/test';

/** View modes now live in the on-demand camera settings. */
export async function setCameraView(root: Page | Locator, name: string) {
  const options = root.locator('.camera-options');
  if (await options.getAttribute('open') === null) await options.locator('summary').click();
  await root.getByRole('button', { name, exact: true }).click();
  if (await options.getAttribute('open') !== null) await options.locator('summary').click();
}
