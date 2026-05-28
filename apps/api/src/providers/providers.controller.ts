import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getRequestContext } from '../auth/request-context';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  list(@Req() req: Request = {} as any) { return this.providers.list(getRequestContext(req)); }

  @Get('capabilities')
  capabilities() { return this.providers.capabilities(); }

  @Post()
  create(@Body() body: unknown, @Req() req: Request = {} as any) { return this.providers.create(body, getRequestContext(req)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown, @Req() req: Request = {} as any) { return this.providers.update(id, body, getRequestContext(req)); }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request = {} as any) { return this.providers.remove(id, getRequestContext(req)); }

  @Post(':id/test')
  test(@Param('id') id: string, @Req() req: Request = {} as any) { return this.providers.test(id, getRequestContext(req)); }

  @Post(':id/test-edit')
  testEdit(@Param('id') id: string, @Req() req: Request = {} as any) { return this.providers.testEdit(id, getRequestContext(req)); }

  @Post('seed-env')
  seedEnv(@Body() body: { name?: string }, @Req() req: Request = {} as any) { return this.providers.seedEnvironmentProvider(body?.name, getRequestContext(req)); }
}
