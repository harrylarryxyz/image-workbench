import { test, expect } from '@playwright/test';

const routes = [
  ['/', /AI Image Workbench|Generate/i],
  ['/gallery', /Gallery/i],
  ['/edit', /Edit|参考|Mask/i],
  ['/prompts', /Prompt/i],
  ['/canvas', /Canvas|节点画布/i],
  ['/providers', /Provider/i],
];

test('core pages render without browser console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  for (const [path, marker] of routes) {
    await page.goto(path as string);
    await expect(page.locator('body')).toContainText(marker as RegExp);
  }

  expect(errors).toEqual([]);
});

test('canvas can add nodes and export graph JSON', async ({ page }) => {
  await page.goto('/canvas');
  await page.getByRole('button', { name: '添加 Prompt 节点' }).click();
  await page.getByRole('button', { name: '添加 Image 节点' }).click();
  await expect(page.getByTestId('canvas-json')).toContainText('Prompt');
  await expect(page.getByTestId('canvas-json')).toContainText('Image Reference');
});
