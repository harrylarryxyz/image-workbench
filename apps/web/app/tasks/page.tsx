import { apiGet } from '../../lib/api';

export default async function TasksPage() {
  const tasks = await apiGet<any[]>('/tasks').catch((error) => [{ error: String(error) }]);
  return <section className="card"><p className="eyebrow">Tasks</p><h1>任务列表</h1><pre>{JSON.stringify(tasks, null, 2)}</pre></section>;
}
