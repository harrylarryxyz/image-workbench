import { describe, expect, it, vi } from 'vitest';
import { TasksController } from './tasks.controller';

describe('TasksController SSE events contract', () => {
  it('returns the task event observable synchronously so Nest can stream snapshots', () => {
    const stream = { subscribe: vi.fn() };
    const tasks = { streamTaskEvents: vi.fn().mockReturnValue(stream) } as any;
    const controller = new TasksController(tasks);
    const req = { on: vi.fn(), headers: {} } as any;

    const result = controller.events('task_123', req);

    expect(result).toBe(stream);
    expect(result).not.toBeInstanceOf(Promise);
    expect(tasks.streamTaskEvents).toHaveBeenCalledWith('task_123', req, expect.objectContaining({ workspaceId: 'default' }));
  });
});
