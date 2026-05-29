import { expect, test } from '@playwright/test';

const forbiddenMainFlow = /Storage Key|Provider readiness|debug-json|JSON\.stringify|raw JSON/i;

async function startVisualStage(page: import('@playwright/test').Page, intent: string) {
  await page.goto('/visual-stage');
  await page.getByLabel(/创作意图|Creation intent/i).fill(intent);
  await page.getByRole('button', { name: /整理创作案|Start Visual Stage/i }).click();
}

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

test('Visual Stage routes sparse avatar taste prompt to Reference-first with one unblocker', async ({ page }) => {
  await startVisualStage(page, '做一张高级一点的头像');

  await expect(page.getByTestId('visual-stage-creation-case')).toContainText(/Reference-first/);
  await expect(page.getByTestId('visual-stage-creation-case')).toContainText(/社交头像|social avatar/i);
  await expect(page.getByTestId('visual-stage-creation-case')).toContainText(/Subject|Missing|待补齐/);
  await expect(page.getByTestId('reference-territories')).toContainText(/高级|克制|商业|真实|设计/);
  await expect(page.getByTestId('visual-stage-unblocker')).toContainText(/Unblocker Card|上传照片|抽象头像/);
  await expect(page.getByRole('button', { name: /开始生成|Generate/i })).toBeDisabled();
});

test('Visual Stage routes clear poster prompt to Generate-first with a champion draft', async ({ page }) => {
  await startVisualStage(page, '为一个面向年轻咖啡爱好者的新冷萃品牌做一张 1:1 社媒首发海报，黑金配色，极简高级，突出瓶身和冰块。');

  await expect(page.getByTestId('visual-stage-creation-case')).toContainText(/Generate-first/);
  await expect(page.getByTestId('visual-stage-creation-case')).toContainText(/年轻咖啡爱好者|黑金|瓶身|冰块/);
  await expect(page.getByTestId('visual-stage-champion')).toContainText(/Champion|当前最佳|首稿/);
  await expect(page.getByTestId('visual-stage-assumptions')).toContainText(/Assumed|假设|1:1|方图/);
  await expect(page.getByRole('button', { name: /开始生成|Generate/i })).toBeEnabled();
});

test('Visual Stage routes real-person celebrity likeness prompt to Ask-first blocker', async ({ page }) => {
  await startVisualStage(page, '用我照片做一张像某明星风格的头像');

  await expect(page.getByTestId('visual-stage-creation-case')).toContainText(/Ask-first/);
  await expect(page.getByTestId('visual-stage-creation-case')).toContainText(/真人|肖像|likeness|IP|明星/);
  await expect(page.getByTestId('visual-stage-unblocker')).toContainText(/Unblocker Card|安全替代|抽象头像|非侵权/);
  await expect(page.getByText(/Visual Stage/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /开始生成|Generate/i })).toBeDisabled();
});

test('Visual Stage feedback updates champion and comparison set', async ({ page }) => {
  await startVisualStage(page, '为冷萃品牌做黑金极简社媒海报，面向年轻咖啡爱好者，突出瓶身和冰块');

  await expect(page.getByTestId('visual-stage-champion')).toContainText(/Champion|当前最佳/);
  await expect(page.getByTestId('visual-stage-comparison')).toContainText(/Comparison Set|对比|备选/);
  await page.getByRole('button', { name: /更克制/ }).click();
  await expect(page.getByTestId('visual-stage-comparison')).toContainText(/更克制版/);
  await expect(page.getByTestId('visual-stage-feedback-status')).toContainText(/反馈已记录|Case updated|创作案已更新/);
});

test('Visual Stage keeps comparison available on mobile after routing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startVisualStage(page, '为冷萃品牌做黑金极简社媒海报，面向年轻咖啡爱好者，突出瓶身和冰块');

  await expect(page.getByTestId('visual-stage-champion')).toBeVisible();
  await expect(page.getByTestId('visual-stage-comparison')).toBeVisible();
  await expect(page.getByTestId('visual-stage-comparison')).toContainText(/更克制|商业|真实|方向|备选/);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('Visual Stage commits champion into a delivery package', async ({ page }) => {
  await startVisualStage(page, '为冷萃品牌做黑金极简社媒海报，面向年轻咖啡爱好者，突出瓶身和冰块');
  await page.getByRole('button', { name: /用这个|Commit champion/i }).click();

  await expect(page.getByTestId('visual-stage-delivery-package')).toContainText(/Delivery Package|交付包/);
  await expect(page.getByTestId('visual-stage-delivery-package')).toContainText(/社媒|海报|use context|用途/);
  await expect(page.getByTestId('visual-stage-delivery-package')).toContainText(/Assumptions|假设/);
  await expect(page.getByRole('button', { name: /导出/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /继续做变体/ })).toBeVisible();
});
