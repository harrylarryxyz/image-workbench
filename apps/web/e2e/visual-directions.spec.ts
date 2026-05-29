import { expect, test } from '@playwright/test';

const directions = [
  ['A', 'Lunar Precision'],
  ['B', 'Cinema Studio'],
  ['C', 'Atelier Gallery'],
  ['D', 'Creative Board'],
  ['E', 'Velvet Suite'],
  ['F', 'Warm Craft'],
];

test('Visual Direction Board renders divergent art directions on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto('/visual-directions');

  await expect(page.getByTestId('visual-directions-board')).toContainText('Visual Direction Board');
  await expect(page.getByTestId('visual-directions-board')).toContainText('先选艺术方向');

  for (const [code, title] of directions) {
    const card = page.getByTestId(`visual-direction-${code}`);
    await expect(card).toBeVisible();
    await expect(card).toContainText(title);
  }

  await expect(page.getByTestId('visual-directions-board')).not.toContainText(/Storage Key|Provider readiness|debug-json|JSON\.stringify|raw JSON/i);
});

test('Visual Direction Board does not horizontally overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visual-directions');

  await expect(page.getByTestId('visual-direction-A')).toBeVisible();
  await expect(page.getByTestId('visual-direction-F')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
