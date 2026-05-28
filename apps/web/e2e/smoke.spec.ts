import { test, expect } from '@playwright/test';

const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l3kG7wAAAABJRU5ErkJggg==', 'base64');

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
  await expect(page.getByText('ref.png')).toBeVisible();
  await page.getByRole('button', { name: '创建编辑任务' }).click();
  await expect(page.getByText('task_edit_e2e')).toBeVisible();
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
  await page.getByPlaceholder('local://uploads/default/... 或图库 storageKey').fill('local://uploads/default/ref.png');
  await expect(page.getByTestId('canvas-json')).toContainText('local://uploads/default/ref.png');
  await page.getByRole('button', { name: '执行画布任务' }).click();
  await expect(page.locator('pre').filter({ hasText: 'task_edit_canvas' })).toBeVisible();
  expect(savedBody.nodes.some((node: any) => node.id.startsWith('image') && node.data.storageKey === 'local://uploads/default/ref.png')).toBe(true);
});
