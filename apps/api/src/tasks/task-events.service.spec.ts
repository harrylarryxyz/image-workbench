import { describe, expect, it } from 'vitest';
import { firstValueFrom, skip, take, toArray } from 'rxjs';
import { TaskEventsService } from './task-events.service';

describe('TaskEventsService', () => {
  it('streams initial connection event and task snapshots on notification', async () => {
    const events = new TaskEventsService();
    let status = 'QUEUED';
    const collected = firstValueFrom(events.stream('task_1', async () => ({ id: 'task_1', status })).pipe(take(2), toArray()));

    status = 'SUCCEEDED';
    events.notify('task_1');

    await expect(collected).resolves.toEqual([
      { event: 'task.update', data: { id: 'task_1', status: 'CONNECTED' } },
      { event: 'task.snapshot', data: { id: 'task_1', status: 'SUCCEEDED' } },
    ]);
  });

  it('does not emit snapshots for other tasks', async () => {
    const events = new TaskEventsService();
    const firstSnapshot = firstValueFrom(events.stream('task_a', async () => ({ id: 'task_a', status: 'RUNNING' })).pipe(skip(1), take(1)));

    events.notify('task_b');
    events.notify('task_a');

    await expect(firstSnapshot).resolves.toEqual({ event: 'task.snapshot', data: { id: 'task_a', status: 'RUNNING' } });
  });
});
