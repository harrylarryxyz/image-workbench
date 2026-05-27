import { describe, expect, it, vi } from 'vitest';
import { TasksController } from './tasks.controller';

describe('TasksController SSE events contract', () => {
  it('exposes task event stream with server-sent event headers', async () => {
    const stream = { pipe: vi.fn() };
    const tasks = { streamTaskEvents: vi.fn().mockResolvedValue(stream) } as any;
    const controller = new TasksController(tasks);
    const res = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      on: vi.fn(),
    } as any;

    await controller.events('task_123', res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-transform');
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    expect(tasks.streamTaskEvents).toHaveBeenCalledWith('task_123', res);
  });
});
