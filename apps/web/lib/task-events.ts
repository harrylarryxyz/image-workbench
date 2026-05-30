import { apiGet } from './api';

export type TaskEventPayload<T = any> = {
  event?: string;
  data?: T;
};

export function subscribeTaskEvents<T>(
  taskId: string,
  onTask: (task: T) => void,
  onFallback?: (error: unknown) => void,
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    onFallback?.(new Error('EventSource is not available'));
    return () => undefined;
  }

  const source = new EventSource(`/api/tasks/${encodeURIComponent(taskId)}/events`);
  let snapshotReceived = false;
  const fallbackTimer = window.setTimeout(() => {
    if (!snapshotReceived) onFallback?.(new Error('Task event stream produced no snapshots'));
  }, 3000);

  const clearFallbackTimer = () => window.clearTimeout(fallbackTimer);
  const handle = (event: MessageEvent) => {
    snapshotReceived = true;
    clearFallbackTimer();
    const parsed = JSON.parse(event.data);
    if (parsed) onTask(parsed as T);
  };
  source.addEventListener('task.snapshot', handle as EventListener);
  source.onerror = (error) => {
    clearFallbackTimer();
    source.close();
    onFallback?.(error);
  };
  return () => {
    clearFallbackTimer();
    source.close();
  };
}

export async function pollTaskUntilTerminal<T extends { status?: string }>(
  taskId: string,
  onTask: (task: T) => void,
  maxAttempts = 90,
  initialDelayMs = 0,
) {
  const terminal = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);
  for (let i = 0; i < maxAttempts; i += 1) {
    if (i > 0 || initialDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, i === 0 ? initialDelayMs : i < 6 ? 2000 : 5000));
    const task = await apiGet<T>(`/tasks/${taskId}`);
    onTask(task);
    if (task.status && terminal.has(task.status)) return;
  }
}
