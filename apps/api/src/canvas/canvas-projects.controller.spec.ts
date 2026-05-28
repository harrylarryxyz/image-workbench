import { describe, expect, it, vi } from 'vitest';
import { CanvasProjectsController } from './canvas-projects.controller';

const node = { id: 'prompt-1', type: 'default', position: { x: 10, y: 20 }, data: { label: 'Prompt\nA neon fox' } };
const edge = { id: 'edge-1', source: 'prompt-1', target: 'task-1', type: 'default', data: { label: 'creates' } };

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
    const controller = new CanvasProjectsController(prisma as any);

    const created = await controller.create({ name: 'Storyboard', description: 'test', nodes: [node], edges: [edge] });

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
      canvasProject: {
        findFirst: vi.fn().mockResolvedValue(row),
        update: vi.fn().mockResolvedValue(row),
      },
    };
    const tasks = {
      createEditTask: vi.fn().mockResolvedValue({ id: 'task_edit_1', status: 'QUEUED' }),
      createGenerateTask: vi.fn(),
    };
    const controller = new CanvasProjectsController(prisma as any, tasks as any);

    const result = await controller.run('canvas_1');

    expect(tasks.createEditTask).toHaveBeenCalledWith(expect.objectContaining({
      prompt: 'make it cinematic',
      refKeys: ['local://uploads/default/ref.png'],
      model: 'gpt-image-2',
    }), expect.any(Object));
    expect(tasks.createGenerateTask).not.toHaveBeenCalled();
    expect(result).toMatchObject({ projectId: 'canvas_1', created: [{ nodeId: 'task-1', taskId: 'task_edit_1', status: 'QUEUED' }] });
  });
});
