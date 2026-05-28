import { Body, Controller, Get, Param, Post, Req, Res, Sse } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TasksService } from './tasks.service';
import { getRequestContext } from '../auth/request-context';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post('generate')
  generate(@Body() body: unknown, @Req() req: Request = {} as any) { return this.tasks.createGenerateTask(body, getRequestContext(req)); }

  @Post('edit')
  edit(@Body() body: unknown, @Req() req: Request = {} as any) { return this.tasks.createEditTask(body, getRequestContext(req)); }

  @Get('queue/status')
  queueStatus(@Req() req: Request = {} as any) { return this.tasks.queueStatus(getRequestContext(req)); }

  @Get('failed')
  failed(@Req() req: Request = {} as any) { return this.tasks.listFailed(getRequestContext(req)); }

  @Get('metrics/summary')
  metrics(@Req() req: Request = {} as any) { return this.tasks.metrics(getRequestContext(req)); }

  @Get()
  list(@Req() req: Request = {} as any) { return this.tasks.listRecent(getRequestContext(req)); }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: Request = {} as any) { return this.tasks.getTask(id, getRequestContext(req)); }

  @Sse(':id/events')
  async events(@Param('id') id: string, @Req() reqOrRes: Request | Response = {} as any, @Res({ passthrough: true }) maybeRes?: Response) {
    const res = (maybeRes ?? reqOrRes) as Response;
    const req = maybeRes ? reqOrRes as Request : {} as Request;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    return this.tasks.streamTaskEvents(id, res, getRequestContext(req));
  }

  @Post('bulk/retry-failed')
  bulkRetry(@Body() body: any, @Req() req: Request = {} as any) { return this.tasks.bulkRetryFailed(body ?? {}, getRequestContext(req)); }

  @Post(':id/retry')
  retry(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) { return this.tasks.retryTask(id, body ?? {}, getRequestContext(req)); }

  @Post(':id/force-stop')
  forceStop(@Param('id') id: string, @Req() req: Request = {} as any) { return this.tasks.forceStopTask(id, getRequestContext(req)); }

  @Get(':id/diagnostic-package')
  diagnostics(@Param('id') id: string, @Req() req: Request = {} as any) { return this.tasks.diagnosticPackage(id, getRequestContext(req)); }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: Request = {} as any) { return this.tasks.cancelTask(id, getRequestContext(req)); }
}
