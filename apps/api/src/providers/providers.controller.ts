import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  list() { return this.providers.list(); }

  @Post('seed-env')
  seedEnv(@Body() body: { name?: string }) { return this.providers.seedEnvironmentProvider(body?.name); }
}
