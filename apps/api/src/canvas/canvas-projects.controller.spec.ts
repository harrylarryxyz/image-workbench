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

  it('updates projects by replacing graph children atomically', async () => {
    const prisma = {
      canvasProject: {
        update: vi.fn().mockResolvedValue({
          id: 'canvas_1', name: 'Updated', description: null, createdAt: new Date('2026-05-27T00:00:00Z'), updatedAt: new Date('2026-05-27T00:00:01Z'),
          nodes: [{ id: node.id, type: node.type, positionX: 10, positionY: 20, dataJson: node.data }],
          edges: [],
        }),
      },
    };
    const controller = new CanvasProjectsController(prisma as any);

    const updated = await controller.update('canvas_1', { name: 'Updated', nodes: [node], edges: [] });

    expect(prisma.canvasProject.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'canvas_1' },
      data: expect.objectContaining({ nodes: { deleteMany: {}, create: expect.any(Array) }, edges: { deleteMany: {}, create: [] } }),
    }));
    expect(updated.nodes).toEqual([node]);
  });
});
