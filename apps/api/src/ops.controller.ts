import { Controller, Get } from '@nestjs/common';
import { TasksService } from './tasks/tasks.service';

@Controller('ops')
export class OpsController {
  constructor(private readonly tasks: TasksService) {}

  @Get('alerts')
  async alerts() {
    const status = await this.tasks.queueStatus();
    const metrics = await this.tasks.metrics();
    const alerts: Array<{ level: string; code: string; message: string }> = [];
    if ((status.queue.waiting ?? 0) + (status.queue.delayed ?? 0) > 10) alerts.push({ level: 'warning', code: 'queue_backlog', message: 'Queue backlog exceeds 10 jobs.' });
    if ((metrics as any).quality?.failureRate > 0.3) alerts.push({ level: 'warning', code: 'high_failure_rate', message: 'Task failure rate is above 30%.' });
    if ((metrics as any).images?.sizeBytes > 5 * 1024 * 1024 * 1024) alerts.push({ level: 'warning', code: 'storage_pressure', message: 'Local image storage exceeds 5GB.' });
    return { alerts, checkedAt: new Date().toISOString(), status, metrics };
  }
}
