import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  list() { return this.providers.list(); }

  @Post()
  create(@Body() body: unknown) { return this.providers.create(body); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) { return this.providers.update(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.providers.remove(id); }

  @Post(':id/test')
  test(@Param('id') id: string) { return this.providers.test(id); }

  @Post('seed-env')
  seedEnv(@Body() body: { name?: string }) { return this.providers.seedEnvironmentProvider(body?.name); }
}
