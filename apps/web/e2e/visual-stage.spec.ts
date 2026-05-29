import { expect, test } from '@playwright/test';

const forbiddenMainFlow = /Storage Key|Provider readiness|debug-json|JSON\.stringify|raw JSON/i;

test('Visual Stage visual master renders stage-first desktop surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/visual-stage');

  await expect(page.getByTestId('visual-stage-shell')).toContainText('Visual Stage');
  await expect(page.getByTestId('visual-stage-shell')).toContainText('Creation Case');
  await expect(page.getByTestId('visual-stage-shell')).toContainText('专业不降级，兴趣不劝退');
  await expect(page.getByTestId('visual-stage-composer')).toBeVisible();
  await expect(page.getByTestId('visual-stage-creation-case')).toBeVisible();
  await expect(page.getByTestId('visual-stage-router')).toContainText(/Reference-first|Generate-first|Ask-first/);
  await expect(page.getByTestId('visual-stage-champion')).toContainText('Champion');
  await expect(page.getByTestId('visual-stage-comparison')).toContainText('Comparison Set');
  await expect(page.getByTestId('reference-territories')).toContainText('Unblocker Card');
  await expect(page.getByTestId('visual-stage-shell')).not.toContainText(forbiddenMainFlow);
});

test('Visual Stage keeps composer, case, champion and comparison first-class on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visual-stage');

  await expect(page.getByTestId('visual-stage-composer')).toBeVisible();
  await expect(page.getByTestId('visual-stage-creation-case')).toBeVisible();
  await expect(page.getByTestId('visual-stage-champion')).toBeVisible();
  await expect(page.getByTestId('visual-stage-comparison')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
