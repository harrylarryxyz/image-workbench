import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getRequestContext } from '../auth/request-context';
import { PromptsService } from './prompts.service';

@Controller('prompts')
export class PromptsController {
  constructor(private readonly prompts: PromptsService) {}

  @Get()
  async list(@Query('tag') tag: string | undefined, @Req() req: Request = {} as any) {
    return this.prompts.list(tag, getRequestContext(req));
  }

  @Post()
  async create(@Body() body: any, @Req() req: Request = {} as any) {
    return this.prompts.create(body, getRequestContext(req));
  }

  @Get('history')
  async history(@Req() req: Request = {} as any) {
    return this.prompts.history(getRequestContext(req));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    return this.prompts.update(id, body, getRequestContext(req));
  }

  @Get(':id/versions')
  async versions(@Param('id') id: string, @Req() req: Request = {} as any) {
    return this.prompts.versions(id, getRequestContext(req));
  }

  @Post(':id/render')
  async render(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    return this.prompts.render(id, body, getRequestContext(req));
  }

  @Post('from-task/:taskId')
  async fromTask(@Param('taskId') taskId: string, @Req() req: Request = {} as any) {
    return this.prompts.fromTask(taskId, getRequestContext(req));
  }

  @Post('enhance')
  enhance(@Body() body: any) {
    return this.prompts.enhance(body);
  }

  @Post('seed')
  async seed(@Req() req: Request = {} as any) {
    return this.prompts.seed(getRequestContext(req));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request = {} as any) {
    return this.prompts.remove(id, getRequestContext(req));
  }
}
