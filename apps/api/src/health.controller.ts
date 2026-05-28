import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from './prisma.service';
import { LocalStorageService } from './storage/local-storage.service';
import { Public } from './auth/public.decorator';

function bool(name: string) { return Boolean(process.env[name]); }
function state(ok: boolean) { return ok ? 'ok' : 'not_ready'; }

type Check = { ok: boolean; state: string };

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly storage: LocalStorageService) {}

  @Public()
  @Get('live')
  live() {
    return { ok: true, service: 'image-workbench-api', checkedAt: new Date().toISOString() };
  }

  @Public()
  @Get('version')
  version() {
    return {
      ok: true,
      version: process.env.APP_VERSION ?? process.env.npm_package_version ?? '0.1.0',
      gitCommit: process.env.GIT_COMMIT ?? process.env.SOURCE_COMMIT ?? 'unknown',
      buildTime: process.env.BUILD_TIME ?? null,
      nodeEnv: process.env.NODE_ENV ?? 'development',
      checkedAt: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  async ready() {
    const checks: Record<string, Check> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true, state: 'ok' };
    } catch {
      checks.database = { ok: false, state: 'unreachable' };
    }

    const redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    try {
      await redis.connect();
      await redis.ping();
      checks.redis = { ok: true, state: 'ok' };
    } catch {
      checks.redis = { ok: false, state: 'unreachable' };
    } finally {
      redis.disconnect();
    }

    const storageReady = this.storage.backend === 'local' || Boolean((this.storage as any).s3 || this.storage.publicBaseUrl);
    checks.storage = { ok: storageReady, state: state(storageReady) };

    const production = process.env.NODE_ENV === 'production';
    const authReady = bool('WORKBENCH_ADMIN_TOKEN');
    checks.auth = { ok: authReady || !production, state: authReady ? 'configured' : 'anonymous-dev' };

    const providerSecretReady = bool('PROVIDER_SECRET_KEY');
    checks.providerSecrets = { ok: providerSecretReady || !production, state: providerSecretReady ? 'configured' : 'legacy-mode' };

    const ok = Object.values(checks).every((check) => check.ok);
    const payload = { ok, checks, checkedAt: new Date().toISOString() };
    if (!ok) throw new ServiceUnavailableException(payload);
    return payload;
  }
}
