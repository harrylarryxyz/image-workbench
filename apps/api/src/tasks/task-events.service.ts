import { Injectable } from '@nestjs/common';
import { Subject, type Observable, fromEvent, interval, merge, NEVER, of } from 'rxjs';
import { filter, map, startWith, switchMap, takeUntil } from 'rxjs/operators';

type TaskEvent = {
  type: 'task.snapshot' | 'task.update' | 'task.heartbeat';
  data: unknown;
};

@Injectable()
export class TaskEventsService {
  private readonly updates = new Subject<string>();

  notify(taskId: string) {
    this.updates.next(taskId);
  }

  stream(taskId: string, getSnapshot: () => Promise<unknown>, close$?: Observable<unknown>): Observable<TaskEvent> {
    const stop$ = close$ ?? NEVER;
    const snapshot$ = merge(
      of(taskId),
      this.updates.pipe(filter((id) => id === taskId)),
    ).pipe(
      switchMap(async () => ({ type: 'task.snapshot' as const, data: await getSnapshot() })),
    );
    const heartbeat$ = interval(15000).pipe(map(() => ({ type: 'task.heartbeat' as const, data: { at: new Date().toISOString() } })));
    return merge(snapshot$, heartbeat$).pipe(startWith({ type: 'task.update' as const, data: { id: taskId, status: 'CONNECTED' } }), takeUntil(stop$));
  }

  closeSignal(reqOrRes: any): Observable<unknown> {
    return fromEvent(reqOrRes, 'close');
  }
}
