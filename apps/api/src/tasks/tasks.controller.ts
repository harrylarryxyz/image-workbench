import { Body, Controller, Get, Param, Post, Res, Sse } from '@nestjs/common';
import type { Response } from 'express';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post('generate')
  generate(@Body() body: unknown) { return this.tasks.createGenerateTask(body); }

  @Post('edit')
  edit(@Body() body: unknown) { return this.tasks.createEditTask(body); }

  @Get('queue/status')
  queueStatus() { return this.tasks.queueStatus(); }

  @Get('failed')
  failed() { return this.tasks.listFailed(); }

  @Get('metrics/summary')
  metrics() { return this.tasks.metrics(); }

  @Get()
  list() { return this.tasks.listRecent(); }

  @Get(':id')
  get(@Param('id') id: string) { return this.tasks.getTask(id); }

  @Sse(':id/events')
  async events(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    return this.tasks.streamTaskEvents(id, res);
  }

  @Post('bulk/retry-failed')
  bulkRetry(@Body() body: any) { return this.tasks.bulkRetryFailed(body ?? {}); }

  @Post(':id/retry')
  retry(@Param('id') id: string, @Body() body: any) { return this.tasks.retryTask(id, body ?? {}); }

  @Post(':id/force-stop')
  forceStop(@Param('id') id: string) { return this.tasks.forceStopTask(id); }

  @Get(':id/diagnostic-package')
  diagnostics(@Param('id') id: string) { return this.tasks.diagnosticPackage(id); }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) { return this.tasks.cancelTask(id); }
}
