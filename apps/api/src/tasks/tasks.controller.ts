import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post('generate')
  generate(@Body() body: unknown) { return this.tasks.createGenerateTask(body); }

  @Get('queue/status')
  queueStatus() { return this.tasks.queueStatus(); }

  @Get()
  list() { return this.tasks.listRecent(); }

  @Get(':id')
  get(@Param('id') id: string) { return this.tasks.getTask(id); }

  @Post(':id/retry')
  retry(@Param('id') id: string) { return this.tasks.retryTask(id); }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) { return this.tasks.cancelTask(id); }
}
