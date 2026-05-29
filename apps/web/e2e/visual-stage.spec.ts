import { expect, test } from '@playwright/test';

const forbiddenMainFlow = /Storage Key|Provider readiness|debug-json|JSON\.stringify|raw JSON/i;
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
);

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

  await page.route('**/api/assets/upload', async (route) => {
    await route.fulfill({
      json: {
        storageKey: 'local://uploads/default/prototype-ref.png',
        assetUrl: '/assets/file?key=local%3A%2F%2Fuploads%2Fdefault%2Fprototype-ref.png',
        originalName: 'prototype-ref.png',
        format: 'png',
        sizeBytes: tinyPng.length,
      },
    });
  });
  await page.locator('input[type="file"][aria-label="选择本地新图片"]').setInputFiles({ name: 'prototype-ref.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.getByTestId('composer-reference-tokens')).toContainText('@图片1');
  await expect(page.getByTestId('composer-reference-tokens').getByText('@图片1')).toBeVisible();
  await expect(page.getByLabel('描述你想创作的画面')).toHaveValue(/@图片1/);
  await expect(page.getByTestId('creation-assistant-thread')).not.toContainText('本地图片已上传');

  await page.getByRole('button', { name: '引用素材或历史图片' }).click();
  await expect(page.getByTestId('mention-reference-picker')).toContainText('素材库：海报氛围图');
  await page.getByRole('button', { name: /素材库：海报氛围图/ }).click();
  await expect(page.getByTestId('composer-reference-tokens')).toContainText('@图片2');
  await expect(page.getByTestId('creation-assistant-thread')).not.toContainText('素材库：海报氛围图');

  await page.getByLabel('描述你想创作的画面').fill('@图片1 保留构图，@图片2 借鉴色调，做一张温柔高级的护肤品宣传图');
  await expect(page.getByTestId('creation-assistant-thread')).not.toContainText('我先这样理解');
  await expect(page.getByTestId('creation-assistant-thread')).not.toContainText('做一张温柔高级的护肤品宣传图');

  await page.getByRole('button', { name: '参数' }).click();
  await expect(page.getByTestId('generation-params-drawer')).toContainText('参考权重 70%');
  await page.getByRole('button', { name: '收起' }).click();

  await page.route('**/api/tasks/edit', async (route) => {
    await route.fulfill({ json: { id: 'prototype_task', type: 'image.edit', status: 'QUEUED' } });
  });
  await page.route('**/api/tasks/prototype_task/events', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'event: task.snapshot\ndata: {"id":"prototype_task","type":"image.edit","status":"RUNNING"}\n\n',
    });
  });
  await page.getByRole('button', { name: '出图关' }).click();
  await expect(page.getByRole('button', { name: '出图开' })).toBeVisible();
  await page.getByRole('button', { name: '发送出图' }).click();
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('真实生成草稿');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('加入画布');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('Visual Stage keeps draft typing out of the thread, clears composer after send, and refreshes to the latest exchange', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visual-stage');
  await page.getByLabel('描述你想创作的画面').fill('第一句：先做一张品牌海报');
  await expect(page.getByTestId('creation-assistant-thread')).not.toContainText('第一句：先做一张品牌海报');

  await page.getByRole('button', { name: '发送' }).click();
  await expect(page.getByLabel('描述你想创作的画面')).toHaveValue('');

  await page.getByLabel('描述你想创作的画面').fill('第二句：改成温润纸面感');
  await page.getByRole('button', { name: '发送' }).click();
  await page.reload();

  const thread = page.getByTestId('creation-assistant-thread');
  await expect(thread).toContainText('第一句：先做一张品牌海报');
  await expect(thread).toContainText('第二句：改成温润纸面感');
  await expect(thread.locator('> div').last()).toContainText('针对「第二句：改成温润纸面感」');
  await expect(thread.locator('> div').last()).toBeInViewport();
});

test('Visual Stage keeps generated draft visible when generation toggle is turned off and truncates long generated filenames', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const longName = 'this-is-a-very-long-generated-filename-that-should-never-push-the-draft-card-outside-of-the-phone-frame-because-it-is-truncated.png';
  let statusPolls = 0;

  await page.route('**/api/tasks/generate', async (route) => {
    await route.fulfill({ json: { id: 'task_long_filename', type: 'image.generate', status: 'QUEUED' } });
  });
  await page.route('**/api/tasks/task_long_filename/events', async (route) => {
    await route.fulfill({ status: 500, body: 'stream unavailable' });
  });
  await page.route('**/api/tasks/task_long_filename', async (route) => {
    statusPolls += 1;
    await route.fulfill({
      json: {
        id: 'task_long_filename',
        type: 'image.generate',
        status: 'SUCCEEDED',
        images: [{ storageKey: `local://outputs/default/${longName}`, assetUrl: `/assets/file?key=local%3A%2F%2Foutputs%2Fdefault%2F${longName}`, format: 'png', sizeBytes: 1234 }],
      },
    });
  });

  await page.goto('/visual-stage');
  await page.getByLabel('描述你想创作的画面').fill('生成一张温润香水海报');
  await page.getByRole('button', { name: '出图关' }).click();
  await page.getByRole('button', { name: '发送出图' }).click();
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('生成完成');
  expect(statusPolls).toBeGreaterThan(0);

  await page.getByRole('button', { name: '出图开' }).click();
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('生成完成');

  const cardBox = await page.getByTestId('draft-card').boundingBox();
  const phoneBox = await page.getByTestId('visual-stage-phone').boundingBox();
  expect(cardBox && phoneBox ? cardBox.x + cardBox.width <= phoneBox.x + phoneBox.width + 1 : false).toBe(true);
});

test('Visual Stage reference tray supports deletion, shows only tokens, and scrolls horizontally without crushing thumbnails', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visual-stage');

  for (let i = 1; i <= 6; i += 1) {
    await page.getByRole('button', { name: '引用素材或历史图片' }).click();
    await page.getByRole('button', { name: /素材库：海报氛围图/ }).click();
  }

  const tray = page.getByTestId('composer-reference-tokens');
  const composer = page.getByTestId('creation-assistant-composer');
  await expect(tray).toContainText('@图片6');
  await expect(tray.getByText('@图片6')).toBeVisible();
  await expect(tray).not.toContainText('素材库：海报氛围图');
  expect(await tray.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);

  const trayBox = await tray.boundingBox();
  const composerBox = await composer.boundingBox();
  expect(trayBox && composerBox ? trayBox.x + trayBox.width <= composerBox.x + composerBox.width + 1 : false).toBe(true);

  const firstToken = tray.getByTestId('reference-token').first();
  const firstBox = await firstToken.boundingBox();
  expect(firstBox?.width).toBeGreaterThanOrEqual(74);

  await tray.getByRole('button', { name: '删除 @图片1' }).click();
  await expect(tray).not.toContainText('@图片1');
});

test('Visual Stage ordinary chat sends a real assistant suggestion and persists conversation after refresh', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/visual-stage');
  await page.getByLabel('描述你想创作的画面').fill('我想做一张温润杂志感护肤品海报，适合小红书首图');
  await page.getByRole('button', { name: '发送' }).click();

  await expect(page.getByTestId('creation-assistant-thread')).toContainText('我想做一张温润杂志感护肤品海报');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('助手建议');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('建议补充');

  await page.reload();
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('我想做一张温润杂志感护肤品海报');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('助手建议');
});

test('Visual Stage restores a pending generation after refresh and shows completed draft from polling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.route('**/api/tasks/generate', async (route) => {
    await route.fulfill({ json: { id: 'task_resume_visual_stage', type: 'image.generate', status: 'QUEUED' } });
  });
  await page.route('**/api/tasks/task_resume_visual_stage/events', async (route) => {
    await route.fulfill({ status: 500, body: 'stream unavailable' });
  });
  await page.route('**/api/tasks/task_resume_visual_stage', async (route) => {
    await route.fulfill({
      json: {
        id: 'task_resume_visual_stage',
        type: 'image.generate',
        status: 'SUCCEEDED',
        images: [{ storageKey: 'local://outputs/default/resumed-draft.png', assetUrl: '/assets/file?key=local%3A%2F%2Foutputs%2Fdefault%2Fresumed-draft.png', format: 'png', sizeBytes: 1234 }],
      },
    });
  });

  await page.goto('/visual-stage');
  await page.getByLabel('描述你想创作的画面').fill('生成一张温润纸面风格的香水海报');
  await page.getByRole('button', { name: '出图关' }).click();
  await page.getByRole('button', { name: '发送出图' }).click();
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('真实生成草稿');

  await page.reload();
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('生成一张温润纸面风格的香水海报');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('生成完成');
  await expect(page.getByRole('button', { name: '加入画布' })).toBeVisible();
});

test('Visual Stage uploads local reference, creates a real draft task, then commits draft into canvas preview', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.route('**/api/assets/upload', async (route) => {
    await route.fulfill({
      json: {
        storageKey: 'local://uploads/default/visual-stage-ref.png',
        assetUrl: '/assets/file?key=local%3A%2F%2Fuploads%2Fdefault%2Fvisual-stage-ref.png',
        originalName: 'visual-stage-ref.png',
        format: 'png',
        sizeBytes: tinyPng.length,
      },
    });
  });
  await page.route('**/api/tasks/edit', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.prompt).toContain('温柔高级的护肤品宣传图');
    expect(body.refKeys).toEqual(['local://uploads/default/visual-stage-ref.png']);
    await route.fulfill({ json: { id: 'task_visual_stage_e2e', type: 'image.edit', status: 'QUEUED' } });
  });
  await page.route('**/api/tasks/task_visual_stage_e2e/events', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'event: task.snapshot\ndata: {"id":"task_visual_stage_e2e","type":"image.edit","status":"SUCCEEDED","images":[{"storageKey":"local://outputs/default/visual-stage-draft.png","assetUrl":"/assets/file?key=local%3A%2F%2Foutputs%2Fdefault%2Fvisual-stage-draft.png","format":"png","sizeBytes":1234}]}\n\n',
    });
  });

  await page.goto('/visual-stage');
  await page.locator('input[type="file"][aria-label="选择本地新图片"]').setInputFiles({ name: 'visual-stage-ref.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.getByTestId('composer-reference-tokens')).toContainText('@图片1');
  await expect(page.getByTestId('composer-reference-tokens')).not.toContainText('visual-stage-ref.png');

  await page.getByLabel('描述你想创作的画面').fill('@图片1 保留构图，做一张温柔高级的护肤品宣传图');
  await page.getByRole('button', { name: '出图关' }).click();
  await page.getByRole('button', { name: '发送出图' }).click();

  await expect(page.getByTestId('creation-assistant-thread')).toContainText('真实生成草稿');
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('生成完成');
  await expect(page.getByRole('button', { name: '加入画布' })).toBeVisible();

  await page.getByRole('button', { name: '加入画布' }).click();
  await expect(page.getByTestId('mobile-canvas-preview')).toContainText('已加入画布');
  await expect(page.getByTestId('mobile-canvas-preview')).toContainText('visual-stage-draft.png');
  await expect(page.getByTestId('visual-stage-shell')).not.toContainText(forbiddenMainFlow);
});
