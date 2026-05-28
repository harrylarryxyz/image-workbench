import { test, expect } from '@playwright/test';

const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l3kG7wAAAABJRU5ErkJggg==', 'base64');
const widePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACgAAAAUCAYAAAD/Rn+7AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAP0lEQVR4nO2UQQ0AQAzCpqn+BeDqTgZb0gf/pgEm8DZn2gAREA1S71kcCRqk3rV41GiQlZk2QAREg9R7lssj+SG3xrvv9DI+AAAAAElFTkSuQmCC', 'base64');

const routes = [
  ['/', /Create Studio|创作工作台/i],
  ['/gallery', /Asset Library|素材库/i],
  ['/edit', /Edit|参考|Mask/i],
  ['/prompts', /Prompt/i],
  ['/canvas', /Canvas|节点画布/i],
  ['/providers', /Provider/i],
];

test('core pages render without browser console errors', async ({ page }) => {
  const errors: string[] = [];
  await page.route('**/api/providers', async (route) => route.fulfill({ json: [] }));
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

test('edit page uploads a reference image and submits an edit task', async ({ page }) => {
  await page.route('**/api/providers', async (route) => route.fulfill({ json: [{ name: 'test-provider', enabled: true, capabilities: { edit: true, maxRefs: 4, source: 'test' }, editHealth: { status: 'ok', errorCode: null, errorMessage: null } }] }));
  await page.route('**/api/assets/upload', async (route) => route.fulfill({ json: { storageKey: 'local://uploads/default/ref.png', assetUrl: '/assets/file?key=local%3A%2F%2Fuploads%2Fdefault%2Fref.png', originalName: 'ref.png', format: 'png', sizeBytes: tinyPng.length } }));
  await page.route('**/api/tasks/edit', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.refKeys).toEqual(['local://uploads/default/ref.png']);
    await route.fulfill({ json: { id: 'task_edit_e2e', type: 'image.edit', status: 'QUEUED' } });
  });
  await page.route('**/api/tasks/task_edit_e2e/events', async (route) => route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'event: task.snapshot\ndata: {"id":"task_edit_e2e","type":"image.edit","status":"SUCCEEDED","images":[]}\n\n' }));

  await page.goto('/edit');
  await page.locator('input[type="file"]').setInputFiles({ name: 'ref.png', mimeType: 'image/png', buffer: tinyPng });
  await page.getByRole('button', { name: '上传参考图' }).click();
  await expect(page.locator('p').filter({ hasText: /^ref\.png$/ })).toBeVisible();
  await page.getByRole('button', { name: '创建编辑任务' }).click();
  await expect(page.getByRole('heading', { name: 'task_edit_e2e' })).toBeVisible();
});


test('mask editor overlay aligns to the reference image and submits painted-area masks', async ({ page }) => {
  let uploadCount = 0;
  await page.route('**/api/providers', async (route) => route.fulfill({ json: [{ name: 'test-provider', enabled: true, capabilities: { edit: true, maxRefs: 4, source: 'test' }, editHealth: { status: 'ok', errorCode: null, errorMessage: null } }] }));
  await page.route('**/api/assets/upload', async (route) => {
    uploadCount += 1;
    const isMask = uploadCount > 1;
    return route.fulfill({ json: { storageKey: isMask ? 'local://uploads/default/mask.png' : 'local://uploads/default/ref.png', assetUrl: isMask ? '/assets/file?key=local%3A%2F%2Fuploads%2Fdefault%2Fmask.png' : '/assets/file?key=local%3A%2F%2Fuploads%2Fdefault%2Fref.png', originalName: isMask ? 'mask.png' : 'ref.png', format: 'png', sizeBytes: isMask ? 128 : widePng.length } });
  });
  await page.route('**/api/assets/file?**', async (route) => route.fulfill({ body: widePng, contentType: 'image/png' }));
  await page.route('**/api/tasks/edit', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.refKeys).toEqual(['local://uploads/default/ref.png']);
    expect(body.maskKey).toBe('local://uploads/default/mask.png');
    expect(body.maskMode).toBe('painted-area');
    await route.fulfill({ json: { id: 'task_mask_e2e', type: 'image.edit', status: 'QUEUED' } });
  });
  await page.route('**/api/tasks/task_mask_e2e/events', async (route) => route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'event: task.snapshot\ndata: {"id":"task_mask_e2e","type":"image.edit","status":"SUCCEEDED","images":[]}\n\n' }));

  await page.goto('/edit');
  await page.locator('input[type="file"]').setInputFiles({ name: 'ref.png', mimeType: 'image/png', buffer: widePng });
  await page.getByRole('button', { name: '上传参考图' }).click();
  const imageBox = await page.locator('.mask-editor-canvas img').boundingBox();
  const stageBox = await page.locator('.mask-editor-canvas .konvajs-content').boundingBox();
  expect(imageBox).not.toBeNull();
  expect(stageBox).not.toBeNull();
  expect(Math.abs((imageBox?.x ?? 0) - (stageBox?.x ?? 1))).toBeLessThan(0.5);
  expect(Math.abs((imageBox?.y ?? 0) - (stageBox?.y ?? 1))).toBeLessThan(0.5);
  expect(Math.abs((imageBox?.width ?? 0) - (stageBox?.width ?? 1))).toBeLessThan(0.5);
  expect(Math.abs((imageBox?.height ?? 0) - (stageBox?.height ?? 1))).toBeLessThan(0.5);

  const maskCanvas = page.locator('.mask-editor-canvas canvas').first();
  await maskCanvas.click({ position: { x: 8, y: 8 } });
  await expect(page.getByRole('button', { name: '保存 Mask' })).toBeEnabled();
  await page.getByRole('button', { name: '保存 Mask' }).click();
  await expect(page.getByText(/局部编辑区域已保存/)).toBeVisible();
  await page.getByRole('button', { name: '创建编辑任务' }).click();
  await expect(page.getByRole('heading', { name: 'task_mask_e2e' })).toBeVisible();
});

test('canvas can add nodes, edit an image reference, export JSON and run the saved graph', async ({ page }) => {
  let savedBody: any = null;
  await page.route('**/api/canvas-projects', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: [] });
    savedBody = route.request().postDataJSON();
    return route.fulfill({ json: { id: 'canvas_e2e', name: savedBody.name, nodes: savedBody.nodes, edges: savedBody.edges } });
  });
  await page.route('**/api/canvas-projects/canvas_e2e/run', async (route) => route.fulfill({ json: { projectId: 'canvas_e2e', created: [{ nodeId: 'task-1', taskId: 'task_edit_canvas', status: 'QUEUED' }] } }));

  await page.goto('/canvas');
  await page.getByRole('button', { name: '添加 Image 节点' }).click();
  await page.getByPlaceholder('local://uploads/default/... 或从素材库发送').fill('local://uploads/default/ref.png');
  await page.getByText('打开 Import / Export JSON').click();
  await expect(page.getByTestId('canvas-json')).toContainText('local://uploads/default/ref.png');
  await page.getByRole('button', { name: '执行画布任务' }).click();
  await expect(page.getByRole('heading', { name: 'task_edit_canvas' })).toBeVisible();
  expect(savedBody.nodes.some((node: any) => node.id.startsWith('image') && node.data.storageKey === 'local://uploads/default/ref.png')).toBe(true);
});
