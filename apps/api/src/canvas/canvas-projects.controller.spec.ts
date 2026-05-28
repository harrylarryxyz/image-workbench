import { describe, expect, it, vi } from 'vitest';
import { CanvasProjectsController } from './canvas-projects.controller';
import { CanvasProjectsService } from './canvas-projects.service';
import { CanvasRunsService } from './canvas-runs.service';

const node = { id: 'prompt-1', type: 'default', position: { x: 10, y: 20 }, data: { label: 'Prompt\nA neon fox' } };
const edge = { id: 'edge-1', source: 'prompt-1', target: 'task-1', type: 'default', data: { label: 'creates' } };

function makeController(prisma: any, tasks?: any) {
  const projects = new CanvasProjectsService(prisma);
  const runs = new CanvasRunsService(prisma, projects, tasks);
  return new CanvasProjectsController(projects, runs);
}

describe('CanvasProjectsController', () => {
  it('creates a project with nodes and edges, then serializes it for React Flow', async () => {
    const prisma = {
      canvasProject: {
        create: vi.fn().mockResolvedValue({
          id: 'canvas_1', name: 'Storyboard', description: 'test', createdAt: new Date('2026-05-27T00:00:00Z'), updatedAt: new Date('2026-05-27T00:00:00Z'),
          nodes: [{ id: node.id, type: node.type, positionX: 10, positionY: 20, dataJson: node.data }],
          edges: [{ id: edge.id, sourceNodeId: edge.source, targetNodeId: edge.target, type: edge.type, dataJson: edge.data }],
        }),
      },
    };
    const controller = makeController(prisma);

    const created = await controller.create({ name: 'Storyboard', description: 'test', nodes: [node], edges: [edge] }, {} as any);

    expect(prisma.canvasProject.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: 'Storyboard',
        nodes: { create: [{ id: node.id, type: node.type, positionX: 10, positionY: 20, dataJson: node.data }] },
        edges: { create: [{ id: edge.id, sourceNodeId: edge.source, targetNodeId: edge.target, type: edge.type, dataJson: edge.data }] },
      }),
    }));
    expect(created).toMatchObject({ id: 'canvas_1', name: 'Storyboard', nodes: [node], edges: [edge] });
  });

  it('runs an edit task when an image reference node feeds a task node', async () => {
    const row = {
      id: 'canvas_1', name: 'Storyboard', description: null, createdAt: new Date('2026-05-27T00:00:00Z'), updatedAt: new Date('2026-05-27T00:00:00Z'), isTemplate: false,
      nodes: [
        { id: 'prompt-1', type: 'default', positionX: 10, positionY: 20, dataJson: { prompt: 'make it cinematic' } },
        { id: 'image-1', type: 'default', positionX: 20, positionY: 30, dataJson: { storageKey: 'local://uploads/default/ref.png' } },
        { id: 'task-1', type: 'default', positionX: 30, positionY: 40, dataJson: { model: 'gpt-image-2', size: '1024x1024', quality: 'low' } },
      ],
      edges: [
        { id: 'e-p', sourceNodeId: 'prompt-1', targetNodeId: 'task-1', type: 'default', dataJson: null },
        { id: 'e-i', sourceNodeId: 'image-1', targetNodeId: 'task-1', type: 'default', dataJson: null },
      ],
    };
    const prisma = {
      canvasRun: {
        create: vi.fn().mockResolvedValue({ id: 'run_1', status: 'RUNNING' }),
        update: vi.fn().mockResolvedValue({ id: 'run_1', projectId: 'canvas_1', status: 'RUNNING', createdAt: new Date('2026-05-27T00:00:00Z'), updatedAt: new Date('2026-05-27T00:00:00Z'), completedAt: null, nodes: [{ id: 'run_node_1', nodeId: 'task-1', status: 'QUEUED', taskId: 'task_edit_1', inputJson: {}, outputJson: {}, errorMessage: null, task: { images: [] } }] }),
      },
      canvasRunNode: {
        create: vi.fn().mockResolvedValue({ id: 'run_node_1' }),
        update: vi.fn().mockResolvedValue({}),
      },
      canvasProject: {
        findFirst: vi.fn().mockResolvedValue(row),
        update: vi.fn().mockResolvedValue(row),
      },
    };
    const tasks = {
      createEditTask: vi.fn().mockResolvedValue({ id: 'task_edit_1', status: 'QUEUED' }),
      createGenerateTask: vi.fn(),
    };
    const controller = makeController(prisma, tasks);

    const result = await controller.run('canvas_1', {}, {} as any);

    expect(tasks.createEditTask).toHaveBeenCalledWith(expect.objectContaining({
      prompt: 'make it cinematic',
      refKeys: ['local://uploads/default/ref.png'],
      model: 'gpt-image-2',
    }), expect.any(Object));
    expect(tasks.createGenerateTask).not.toHaveBeenCalled();
    expect(result).toMatchObject({ projectId: 'canvas_1', created: [{ nodeId: 'task-1', taskId: 'task_edit_1', status: 'QUEUED' }] });
    expect(prisma.canvasRun.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ projectId: 'canvas_1', status: 'RUNNING' }) }));
    expect(prisma.canvasRunNode.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ nodeId: 'task-1', status: 'QUEUED' }) }));
  });

  it('does not delete graph nodes on metadata-only project updates', async () => {
    const prisma = {
      canvasProject: {
        findFirst: vi.fn().mockResolvedValue({ id: 'canvas_1' }),
        update: vi.fn().mockResolvedValue({
          id: 'canvas_1', name: 'Renamed', description: null, isTemplate: false,
          createdAt: new Date('2026-05-27T00:00:00Z'), updatedAt: new Date('2026-05-27T00:00:00Z'),
          nodes: [{ id: node.id, type: node.type, positionX: 10, positionY: 20, dataJson: node.data }],
          edges: [{ id: edge.id, sourceNodeId: edge.source, targetNodeId: edge.target, type: edge.type, dataJson: edge.data }],
        }),
      },
    };
    const controller = makeController(prisma);

    await controller.update('canvas_1', { name: 'Renamed' }, {} as any);

    expect(prisma.canvasProject.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.not.objectContaining({ nodes: expect.anything(), edges: expect.anything() }),
    }));
  });

  it('reconciles canvas run nodes from linked terminal tasks', async () => {
    const completedTask = { id: 'task_1', status: 'SUCCEEDED', images: [{ id: 'img_1', storageKey: 'local://outputs/img.png', thumbnailKey: 'local://thumbs/img.webp' }] };
    const run = { id: 'run_1', projectId: 'canvas_1', label: null, status: 'RUNNING', createdAt: new Date('2026-05-27T00:00:00Z'), updatedAt: new Date('2026-05-27T00:00:00Z'), completedAt: null, nodes: [{ id: 'rn_1', nodeId: 'task-1', status: 'RUNNING', taskId: 'task_1', inputJson: {}, outputJson: {}, errorMessage: null, task: completedTask }] };
    const prisma = {
      canvasRun: {
        findMany: vi.fn().mockResolvedValue([run]),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...run, status: data.status, completedAt: data.completedAt, nodes: [{ ...run.nodes[0], status: 'SUCCEEDED', outputJson: { taskId: 'task_1', status: 'SUCCEEDED', images: [{ id: 'img_1', storageKey: 'local://outputs/img.png', thumbnailKey: 'local://thumbs/img.webp' }] }, task: completedTask }] })),
      },
      canvasRunNode: {
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...run.nodes[0], ...data, task: completedTask })),
      },
    };
    const controller = makeController(prisma);

    const rows = await controller.runs('canvas_1', {} as any);

    expect(prisma.canvasRunNode.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'SUCCEEDED' }) }));
    expect(prisma.canvasRun.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'SUCCEEDED' }) }));
    expect(rows[0]).toMatchObject({ id: 'run_1', status: 'SUCCEEDED', nodes: [{ status: 'SUCCEEDED', images: [{ id: 'img_1' }] }] });
  });
});
