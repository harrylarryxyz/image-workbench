import { expect, test } from '@playwright/test';

const forbiddenMainFlow = /Storage Key|Provider readiness|debug-json|JSON\.stringify|raw JSON/i;

test('Visual Stage mobile-first creation assistant prototype renders without debug copy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visual-stage');

  await expect(page.getByTestId('visual-stage-shell')).toContainText('创作中心原型');
  await expect(page.getByTestId('visual-stage-shell')).toContainText('创作助手');
  await expect(page.getByTestId('visual-stage-shell')).toContainText('移动端优先');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('自然语言开始');
  await expect(page.getByTestId('creation-assistant-composer')).toBeVisible();
  await expect(page.getByTestId('mobile-canvas-preview')).toContainText('轻量画布预告');
  await expect(page.getByTestId('visual-stage-shell')).not.toContainText(forbiddenMainFlow);
});

test('Visual Stage creation assistant supports reference and mock draft states on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visual-stage');

  await page.getByRole('button', { name: /＋参考图/ }).click();
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('已添加参考图');

  await page.getByLabel('描述你想创作的画面').fill('做一张温柔高级的护肤品宣传图，适合小红书封面');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('我先这样理解');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('结果会进入画布');

  await page.getByRole('button', { name: /生成初稿/ }).click();
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('初稿占位');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('加到画布');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
