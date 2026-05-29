import { expect, test } from '@playwright/test';

const forbiddenMainFlow = /Storage Key|Provider readiness|debug-json|JSON\.stringify|raw JSON/i;

test('Visual Stage mobile-first creation assistant prototype renders without debug copy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visual-stage');

  await expect(page.getByTestId('visual-stage-shell')).toContainText('创作中心原型');
  await expect(page.getByTestId('visual-stage-shell')).toContainText('创作助手');
  await expect(page.getByTestId('visual-stage-shell')).toContainText('移动端优先');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('默认普通对话');
  await expect(page.getByTestId('creation-assistant-composer')).toBeVisible();
  await expect(page.getByRole('button', { name: '添加本地新图片' })).toBeVisible();
  await expect(page.getByRole('button', { name: '引用素材或历史图片' })).toBeVisible();
  await expect(page.getByRole('button', { name: '出图关' })).toBeVisible();
  await expect(page.getByTestId('mobile-canvas-preview')).toContainText('轻量画布预告');
  await expect(page.getByTestId('visual-stage-shell')).not.toContainText(forbiddenMainFlow);
});

test('Visual Stage supports + local image and @ advanced reference tokens on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visual-stage');

  await page.getByRole('button', { name: '添加本地新图片' }).click();
  await expect(page.getByTestId('composer-reference-tokens')).toContainText('@图片1');
  await expect(page.getByLabel('描述你想创作的画面')).toHaveValue(/@图片1/);
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('本地新图片');

  await page.getByRole('button', { name: '引用素材或历史图片' }).click();
  await expect(page.getByTestId('mention-reference-picker')).toContainText('素材库：海报氛围图');
  await page.getByRole('button', { name: /素材库：海报氛围图/ }).click();
  await expect(page.getByTestId('composer-reference-tokens')).toContainText('@图片2');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('素材图片');

  await page.getByLabel('描述你想创作的画面').fill('@图片1 保留构图，@图片2 借鉴色调，做一张温柔高级的护肤品宣传图');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('我先这样理解');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('普通对话');

  await page.getByRole('button', { name: '参数' }).click();
  await expect(page.getByTestId('generation-params-drawer')).toContainText('参考权重 70%');
  await page.getByRole('button', { name: '收起' }).click();

  await page.getByRole('button', { name: '出图关' }).click();
  await expect(page.getByRole('button', { name: '出图开' })).toBeVisible();
  await page.getByRole('button', { name: '发送出图' }).click();
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('生成草稿占位');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('加入画布');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
