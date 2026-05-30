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
  await expect(page.getByTestId('creation-board-shell')).toContainText('Creation Board');
  await expect(page.getByTestId('visual-stage-shell')).not.toContainText(forbiddenMainFlow);
});

test('Creation Board starts empty, then confirmed drafts can be arranged, inspected, and long-pressed into the assistant', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 920 });
  await page.route('**/api/tasks/generate', async (route) => {
    await route.fulfill({ json: { id: 'task_board_drag', type: 'image.generate', status: 'QUEUED' } });
  });
  await page.route('**/api/tasks/task_board_drag/events', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'event: task.snapshot\ndata: {"id":"task_board_drag","type":"image.generate","status":"SUCCEEDED","images":[{"storageKey":"local://outputs/default/drag-node.png","assetUrl":"/assets/file?key=local%3A%2F%2Foutputs%2Fdefault%2Fdrag-node.png","format":"png","sizeBytes":1234}]}\n\n',
    });
  });
  await page.route('**/api/assets/file?**', async (route) => route.fulfill({ body: tinyPng, contentType: 'image/png' }));

  await page.goto('/visual-stage');
  await expect(page.getByTestId('creation-board-empty-state')).toContainText('空白创作案板');
  await expect(page.locator('[data-creation-object-id]')).toHaveCount(0);

  await page.getByLabel('描述你想创作的画面').fill('生成一张可拖动的温润纸面感海报');
  await page.getByRole('button', { name: '出图关' }).click();
  await page.getByRole('button', { name: '发送出图' }).click();

  const imageNode = page.locator('[data-creation-object-id^="session-task_board_drag-0-"]').first();
  await expect(page.getByTestId('draft-card')).toContainText('待审美确认');
  await expect(imageNode).toHaveCount(0);
  await expect(page.getByTestId('creation-board-empty-state')).toContainText('审美确认后，图片、文本备注和来源说明才会进入画布');

  await page.getByTestId('draft-card').getByRole('button', { name: '加入画布' }).click();
  await expect(imageNode).toBeVisible();
  await expect(page.getByTestId('creation-board-empty-state')).toHaveCount(0);
  await page.getByRole('button', { name: '整理画布' }).click();
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('visual-stage.creation-board.node-positions.v1') ?? '')).toContain('task_board_drag');

  await imageNode.click();
  const inspector = page.getByRole('complementary').getByTestId('creation-object-inspector');
  await expect(inspector).toContainText('会话主图');
  await expect(inspector).toContainText('已加入画布');

  const nodeBox = await imageNode.boundingBox();
  expect(nodeBox).not.toBeNull();
  await page.mouse.move((nodeBox?.x ?? 0) + 32, (nodeBox?.y ?? 0) + 32);
  await page.mouse.down();
  await page.waitForTimeout(720);
  await page.mouse.up();

  await expect(page.getByTestId('creation-assistant-context')).toContainText('会话主图');
  await expect(page.getByTestId('composer-board-reference-token')).toContainText('@图片1');
  await expect(page.getByLabel('描述你想创作的画面')).toHaveValue(/@图片1/);
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
  await expect(page.getByTestId('generation-params-drawer')).toContainText('默认 1 张');
  await expect(page.getByTestId('generation-params-drawer')).toContainText('API 模式');
  await expect(page.getByTestId('generation-count-select')).toHaveValue('1');
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
  await page.route('**/api/agent/visual-stage/reply', async (route) => {
    const body = route.request().postDataJSON();
    await route.fulfill({ json: { provider: 'local', title: '助手建议', body: `针对「${body.intent}」：建议补充主体、比例和发布渠道。`, chips: ['普通对话', '建议补充'] } });
  });
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

test('Visual Stage keeps generated draft visible when generation toggle is turned off and hides generated filenames', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const longName = 'this-is-a-very-long-generated-filename-that-should-never-be-visible-to-users.png';
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
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('生成完成 · 1 张候选');
  await expect(page.getByTestId('creation-assistant-thread')).not.toContainText(longName);
  expect(statusPolls).toBeGreaterThan(0);

  await page.getByRole('button', { name: '出图开' }).click();
  await expect(page.getByTestId('creation-assistant-thread')).toContainText('生成完成 · 1 张候选');

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

test('Visual Stage uses the server LLM assistant reply instead of the old local template when chatting', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/agent/visual-stage/reply', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.intent).toContain('护肤品海报');
    expect(body.generateMode).toBe(false);
    await route.fulfill({ json: { provider: 'llm', title: '创作判断', body: '建议先固定温润纸面感、主体层级和发布比例，再决定是否出图。', chips: ['真实助手', '先定方向'] } });
  });

  await page.goto('/visual-stage');
  await page.getByLabel('描述你想创作的画面').fill('做一张温润纸面感护肤品海报');
  await page.getByRole('button', { name: '发送' }).click();

  const thread = page.getByTestId('creation-assistant-thread');
  await expect(thread).toContainText('创作判断');
  await expect(thread).toContainText('建议先固定温润纸面感');
  await expect(thread).toContainText('真实助手');
  await expect(thread).not.toContainText('针对「做一张温润纸面感护肤品海报」');
  await expect(page.getByTestId('visual-stage-shell')).not.toContainText(forbiddenMainFlow);
});


test('Visual Stage ordinary chat persists assistant conversation after refresh', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/agent/visual-stage/reply', async (route) => {
    await route.fulfill({ json: { provider: 'local', title: '助手建议', body: '建议补充主体、比例和发布渠道。', chips: ['普通对话', '建议补充'] } });
  });

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

test('Visual Stage makes references previewable, chips actionable, and generation mode bypasses assistant chatter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let assistantCalls = 0;
  const visibleFileName = 'customer-visible-output.png';

  await page.route('**/api/agent/visual-stage/reply', async (route) => {
    assistantCalls += 1;
    await route.fulfill({ json: { provider: 'llm', title: '助手建议', body: '可以先补一个画幅比例。', chips: ['补充 3:4 比例', '保持主体'] } });
  });
  await page.route('**/api/assets/upload', async (route) => {
    await route.fulfill({ json: { storageKey: 'local://uploads/default/reference-preview.png', assetUrl: '/assets/file?key=local%3A%2F%2Fuploads%2Fdefault%2Freference-preview.png', originalName: 'reference-preview.png', format: 'png', sizeBytes: tinyPng.length } });
  });
  await page.route('**/api/assets/file?**', async (route) => route.fulfill({ body: tinyPng, contentType: 'image/png' }));
  await page.route('**/api/tasks/generate', async (route) => {
    await route.fulfill({ json: { id: 'task_human_summary', type: 'image.generate', status: 'QUEUED' } });
  });
  await page.route('**/api/tasks/task_human_summary/events', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `event: task.snapshot\ndata: {"id":"task_human_summary","type":"image.generate","status":"SUCCEEDED","images":[{"storageKey":"local://outputs/default/${visibleFileName}","assetUrl":"/assets/file?key=local%3A%2F%2Foutputs%2Fdefault%2F${visibleFileName}","format":"png","sizeBytes":1234}]}\n\n`,
    });
  });

  await page.goto('/visual-stage');
  await page.getByLabel('描述你想创作的画面').fill('先聊一张温润海报');
  await page.getByRole('button', { name: '发送' }).click();
  await page.getByRole('button', { name: '补充 3:4 比例' }).click();
  await expect(page.getByLabel('描述你想创作的画面')).toHaveValue('补充 3:4 比例');

  await page.locator('input[type="file"][aria-label="选择本地新图片"]').setInputFiles({ name: 'reference-preview.png', mimeType: 'image/png', buffer: tinyPng });
  const firstToken = page.getByTestId('reference-token').first();
  await expect(firstToken.getByRole('img', { name: '@图片1 缩略图' })).toBeVisible();
  await expect(firstToken).not.toContainText('reference-preview.png');
  await firstToken.getByRole('button', { name: '删除 @图片1' }).click();

  await page.getByLabel('描述你想创作的画面').fill('生成一张温润香水海报');
  await page.getByRole('button', { name: '出图关' }).click();
  await page.getByRole('button', { name: '发送出图' }).click();

  await expect(page.getByTestId('draft-card')).toContainText('生成完成 · 1 张候选');
  await expect(page.getByTestId('draft-card')).not.toContainText(visibleFileName);
  expect(assistantCalls).toBe(1);
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

test('Visual Stage supports comparison drafts, champion selection, natural-language references, and no duplicate continue-edit action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/assets/upload', async (route) => {
    await route.fulfill({ json: { storageKey: 'local://uploads/default/role-ref.png', assetUrl: '/assets/file?key=local%3A%2F%2Fuploads%2Fdefault%2Frole-ref.png', originalName: 'role-ref.png', format: 'png', sizeBytes: tinyPng.length } });
  });
  await page.route('**/api/tasks/edit', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.count).toBe(2);
    expect(body.refKeys).toEqual(['local://uploads/default/role-ref.png']);
    expect(body.prompt).toContain('@图片1 做一张温润海报');
    expect(body.prompt).not.toContain('作为构图参考');
    expect(body.prompt).not.toContain('作为产品参考');
    await route.fulfill({ json: { id: 'task_comparison_set', type: 'image.edit', status: 'QUEUED' } });
  });
  await page.route('**/api/tasks/task_comparison_set/events', async (route) => route.fulfill({ status: 500, body: 'stream unavailable' }));
  await page.route('**/api/tasks/task_comparison_set', async (route) => {
    await route.fulfill({ json: { id: 'task_comparison_set', type: 'image.edit', status: 'SUCCEEDED', images: [
      { storageKey: 'local://outputs/default/draft-a.png', assetUrl: '/assets/file?key=local%3A%2F%2Foutputs%2Fdefault%2Fdraft-a.png', format: 'png', sizeBytes: 1234 },
      { storageKey: 'local://outputs/default/draft-b.png', assetUrl: '/assets/file?key=local%3A%2F%2Foutputs%2Fdefault%2Fdraft-b.png', format: 'png', sizeBytes: 1234 },
    ] } });
  });

  await page.goto('/visual-stage');
  await page.locator('input[type="file"][aria-label="选择本地新图片"]').setInputFiles({ name: 'role-ref.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.getByTestId('composer-reference-tokens')).toContainText('@图片1');
  await expect(page.getByTestId('composer-reference-tokens')).not.toContainText('构图');
  await page.getByLabel('描述你想创作的画面').fill('@图片1 做一张温润海报');
  await page.getByRole('button', { name: '参数' }).click();
  await page.getByTestId('generation-count-select').selectOption('2');
  await page.getByRole('button', { name: '收起' }).click();
  await page.getByRole('button', { name: '出图关' }).click();
  await page.getByRole('button', { name: '发送出图' }).click();

  await expect(page.getByTestId('draft-card')).toContainText('比较草稿');
  await page.getByRole('button', { name: '选择第 2 张为冠军图' }).click();
  await expect(page.getByTestId('draft-card')).toContainText('冠军图 2');
  await expect(page.getByRole('button', { name: '继续改' })).toHaveCount(0);
  await page.getByRole('button', { name: '加入画布' }).click();
  await expect(page.getByTestId('creation-board-shell')).toContainText('draft-b.png');
});

test('Visual Stage Creation Board tracks intent, natural-language references, branches, and reuses board image as reference', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/assets/upload', async (route) => {
    await route.fulfill({ json: { storageKey: 'local://uploads/default/board-product.png', assetUrl: '/assets/file?key=local%3A%2F%2Fuploads%2Fdefault%2Fboard-product.png', originalName: 'board-product.png', format: 'png', sizeBytes: tinyPng.length } });
  });
  await page.route('**/api/agent/visual-stage/reply', async (route) => {
    await route.fulfill({ json: { provider: 'llm', title: '创作判断', body: '我会按自然语言理解 @图片1，保持主体。', chips: ['主体保真'] } });
  });
  await page.route('**/api/tasks/edit', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.prompt).toContain('@图片1 做一张温润纸面感产品海报');
    expect(body.prompt).not.toContain('作为产品参考');
    expect(body.prompt).not.toContain('作为构图参考');
    await route.fulfill({ json: { id: 'task_board_case', type: 'image.edit', status: 'QUEUED' } });
  });
  await page.route('**/api/tasks/task_board_case/events', async (route) => route.fulfill({ status: 500, body: 'stream unavailable' }));
  await page.route('**/api/tasks/task_board_case', async (route) => {
    await route.fulfill({ json: { id: 'task_board_case', type: 'image.edit', status: 'SUCCEEDED', images: [
      { storageKey: 'local://outputs/default/board-a.png', assetUrl: '/assets/file?key=local%3A%2F%2Foutputs%2Fdefault%2Fboard-a.png', format: 'png', sizeBytes: 1234 },
      { storageKey: 'local://outputs/default/board-b.png', assetUrl: '/assets/file?key=local%3A%2F%2Foutputs%2Fdefault%2Fboard-b.png', format: 'png', sizeBytes: 1234 },
    ] } });
  });

  await page.goto('/visual-stage');
  await page.locator('input[type="file"][aria-label="选择本地新图片"]').setInputFiles({ name: 'board-product.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.getByTestId('composer-reference-tokens')).toContainText('@图片1');
  await expect(page.getByTestId('composer-reference-tokens')).not.toContainText('产品');
  await page.getByLabel('描述你想创作的画面').fill('@图片1 做一张温润纸面感产品海报');
  await page.getByRole('button', { name: '参数' }).click();
  await page.getByTestId('generation-count-select').selectOption('2');
  await page.getByRole('button', { name: '收起' }).click();
  await page.getByRole('button', { name: '出图关' }).click();
  await page.getByRole('button', { name: '发送出图' }).click();
  await page.getByRole('button', { name: '选择第 2 张为冠军图' }).click();
  await expect(page.getByRole('button', { name: '继续改' })).toHaveCount(0);
  await page.getByRole('button', { name: '加入画布' }).click();

  await expect(page.getByTestId('creation-board-shell')).toContainText('Creation Board');
  await expect(page.getByTestId('creation-board-shell')).toContainText('做一张温润纸面感产品海报');
  await expect(page.getByTestId('creation-board-shell')).toContainText('@图片1 · 参考');
  await expect(page.getByTestId('creation-board-shell')).toContainText('会话主图 · board-b.png');
  await expect(page.getByTestId('creation-board-shell')).toContainText('第 1 版');

  await page.getByRole('button', { name: '把当前主图作为 @图片 继续参考' }).click();
  await expect(page.getByTestId('composer-reference-tokens')).toContainText('@图片2');
  await expect(page.getByTestId('composer-reference-tokens')).not.toContainText('风格');
  await expect(page.getByTestId('composer-board-reference-token').first()).toContainText('@图片2');
  await expect(page.getByLabel('描述你想创作的画面')).toHaveValue('');
});


test('Visual Stage uploads local reference, creates a real draft task, then commits draft into canvas preview', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.route('**/api/agent/visual-stage/reply', async (route) => {
    await route.fulfill({ json: { provider: 'local', title: '助手建议', body: '参考图已进入生成上下文。', chips: ['已带参考图'] } });
  });
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
  await expect(page.getByTestId('creation-board-shell')).toContainText('已加入画布');
  await expect(page.getByTestId('creation-board-shell')).toContainText('visual-stage-draft.png');
  await expect(page.getByTestId('visual-stage-shell')).not.toContainText(forbiddenMainFlow);
});
