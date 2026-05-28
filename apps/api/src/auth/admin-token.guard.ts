import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { attachRequestContext, canUseMethod, DEFAULT_WORKSPACE_ID, readBearerToken, resolveRequestContext, tokenHash } from './request-context';
import { IS_PUBLIC_KEY } from './public.decorator';

export const ADMIN_TOKEN_ENV = 'WORKBENCH_ADMIN_TOKEN';

const buckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(req: Request, token?: string | null) {
  const now = Date.now();
  const key = token ? `token:${tokenHash(token)}` : `ip:${req.ip ?? req.socket.remoteAddress ?? 'unknown'}`;
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  current.count += 1;
  if (current.count > Number(process.env.WORKBENCH_RATE_LIMIT_PER_MINUTE ?? 240)) {
    throw new HttpException('rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { workbenchContext?: any }>();
    const token = readBearerToken(req);
    checkRateLimit(req, token);
    const adminToken = process.env[ADMIN_TOKEN_ENV];

    if (adminToken && token === adminToken) {
      attachRequestContext(req, {
        workspaceId: String(req.headers['x-workspace-id'] ?? DEFAULT_WORKSPACE_ID),
        tokenHash: tokenHash(token),
        label: 'bootstrap-admin-token',
        role: 'owner',
        ip: req.ip,
        userAgent: String(req.headers['user-agent'] ?? ''),
        authSource: 'admin-token',
      });
      return true;
    }

    if (!adminToken && !token) {
      attachRequestContext(req, {
        workspaceId: String(req.headers['x-workspace-id'] ?? DEFAULT_WORKSPACE_ID),
        role: 'owner',
        ip: req.ip,
        userAgent: String(req.headers['user-agent'] ?? ''),
        authSource: 'anonymous-dev',
      });
      return true;
    }

    const ctx = await resolveRequestContext(this.prisma, req);
    if (ctx.authSource !== 'session') throw new UnauthorizedException('admin token or session token required');
    if (!canUseMethod(ctx.role, req.method, req.path)) throw new UnauthorizedException('insufficient role');
    attachRequestContext(req, ctx);
    return true;
  }
}
