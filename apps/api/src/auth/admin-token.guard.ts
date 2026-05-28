import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export const ADMIN_TOKEN_ENV = 'WORKBENCH_ADMIN_TOKEN';

function readBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

@Injectable()
export class AdminTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const token = process.env[ADMIN_TOKEN_ENV];
    if (!token) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const provided = readBearer(req) ?? String(req.headers['x-admin-token'] ?? '');
    if (provided === token) return true;
    throw new UnauthorizedException('admin token required');
  }
}
