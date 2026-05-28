import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getRequestContext } from '../auth/request-context';
import { CanvasProjectsService } from './canvas-projects.service';
import { CanvasRunsService } from './canvas-runs.service';

@Controller('canvas-projects')
export class CanvasProjectsController {
  constructor(private readonly projects: CanvasProjectsService, private readonly runsService: CanvasRunsService) {}

  @Get('templates')
  async templates(@Req() req: Request = {} as any) {
    return this.projects.templates(getRequestContext(req));
  }

  @Post('templates/:id/use')
  async useTemplate(@Param('id') id: string, @Body() body: any = {}, @Req() req: Request = {} as any) {
    return this.projects.useTemplate(id, body, getRequestContext(req));
  }

  @Get()
  async list(@Query('templates') templates: string | undefined, @Req() req: Request = {} as any) {
    return this.projects.list(templates, getRequestContext(req));
  }

  @Post()
  async create(@Body() body: any, @Req() req: Request = {} as any) {
    return this.projects.create(body, getRequestContext(req));
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: Request = {} as any) {
    return this.projects.get(id, getRequestContext(req));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: Request = {} as any) {
    return this.projects.update(id, body, getRequestContext(req));
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request = {} as any) {
    return this.projects.delete(id, getRequestContext(req));
  }

  @Get(':id/runs')
  async runs(@Param('id') id: string, @Req() req: Request = {} as any) {
    return this.runsService.runs(id, getRequestContext(req));
  }

  @Post(':id/run')
  async run(@Param('id') id: string, @Body() body: any = {}, @Req() req: Request = {} as any) {
    return this.runsService.run(id, body, getRequestContext(req));
  }

  @Post(':id/run/:nodeId')
  async rerunNode(@Param('id') id: string, @Param('nodeId') nodeId: string, @Req() req: Request = {} as any) {
    return this.runsService.rerunNode(id, nodeId, getRequestContext(req));
  }

  @Post(':id/runs/:runId/replay')
  async replay(@Param('id') id: string, @Param('runId') runId: string, @Req() req: Request = {} as any) {
    return this.runsService.replay(id, runId, getRequestContext(req));
  }
}
