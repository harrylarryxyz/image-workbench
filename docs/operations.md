# Operations

## Backup strategy

For the current single-VPS deployment, `STORAGE_BACKEND=local` is still the recommended operating mode until remote object storage is actually needed. Back up both mutable stores:

- PostgreSQL from `DATABASE_URL`
- local image assets from `STORAGE_DIR` or `/opt/image-workbench/shared/uploads` in production

Remote object storage can be enabled with `STORAGE_BACKEND=s3|r2|minio`; the same backup policy still applies to PostgreSQL and any local shared state.

## Local/manual backup

```bash
pnpm backup -- --app-dir . --output-dir ./backups --keep 14
```

The backup script creates a timestamped directory containing:

- `database.sql.gz` when `pg_dump` and `DATABASE_URL` are available
- `uploads.tar.gz` when the storage directory exists
- `manifest.txt` with checksums and restore notes

Dry-run first when changing paths:

```bash
pnpm backup -- --dry-run --app-dir . --output-dir ./backups
```

## Production backup on Rabisu

From the control machine, using the VPS vault credentials:

```bash
set -a; . /root/.vps-vault/credentials.env; set +a
pnpm backup:rabisu
```

The Rabisu helper loads `/opt/image-workbench/shared/.env`, `/opt/image-workbench/current/.env.local`, or `/opt/image-workbench/current/.env` when present; writes archives to `/opt/image-workbench/backups/data`; and keeps a machine-readable manifest at `/opt/image-workbench/backups/data/latest-manifest.json`.

From Rabisu directly:

```bash
cd /opt/image-workbench/current
./scripts/backup-image-workbench.sh \
  --app-dir /opt/image-workbench/current \
  --env-file /opt/image-workbench/shared/.env \
  --output-dir /opt/image-workbench/backups/data \
  --keep 14
```

Recommended cron entry:

```cron
17 3 * * * cd /opt/image-workbench/current && ./scripts/backup-image-workbench.sh --app-dir /opt/image-workbench/current --env-file /opt/image-workbench/shared/.env --output-dir /opt/image-workbench/backups/data --keep 14 >/var/log/image-workbench-backup.log 2>&1
```

## Restore drill

Do not blindly restore production data over a live system. Use a disposable target first:

```bash
set -a; . /root/.vps-vault/credentials.env; set +a
RESTORE_MANIFEST=/opt/image-workbench/backups/data/latest-manifest.json \
  pnpm restore:rabisu
```

The helper prints the manifest, verifies SHA-256 checksums, extracts uploads with path traversal protection, and expands database dumps into a drill directory. A full production restore still requires explicit human review because it can replace database rows and uploaded images.

Manual restore principles:

1. Take a fresh pre-restore backup first.
2. Stop `image-workbench-api` and `image-workbench-web`.
3. Restore code/config separately from mutable data.
4. Restore PostgreSQL only after explicit data-impact review.
5. Restore uploads into `STORAGE_DIR` only after checking target path and ownership.
6. Restart services and run loopback smoke checks.

## Health and readiness

Deployment and monitoring use:

- `GET /health/live` — process liveness
- `GET /health/ready` — database, Redis, storage, auth, and provider-secret readiness
- `GET /health/version` — app version, git commit, build time, runtime env

`/health/ready` returns a service-unavailable response if any required production dependency is not ready. The Ops page displays these checks together with queue, storage, provider, backup, and audit signals.

## Low-memory Rabisu deployment

Rabisu currently has limited memory. Remote `tsc` or `next build` can be killed by the kernel, so production deploys use locally verified artifacts:

```bash
pnpm deploy:rabisu
```

The deployment script does the following:

1. Runs local API tests/typecheck, Web typecheck/build, production API-base guard, Playwright smoke, and API build.
2. Creates a source archive from `git archive HEAD`.
3. Creates a separate artifact archive for `apps/api/dist` and `apps/web/.next`.
4. Uploads both to Rabisu.
5. Extracts into `/opt/image-workbench/releases/<commit>-<timestamp>`.
6. Preserves runtime state through symlinks to `/opt/image-workbench/shared/.env` and `/opt/image-workbench/shared/uploads`.
7. Runs Prisma migration and lightweight remote guards.
8. Switches `/opt/image-workbench/current`, restarts services, and smoke-tests API/Web/health loopback.
9. Prunes old release directories, keeping the latest 5 by default plus the active release.

Useful options:

```bash
pnpm deploy:rabisu -- --skip-restart
pnpm deploy:rabisu -- --skip-local-verify
pnpm deploy:rabisu -- --keep-releases 3
```

Use `--skip-local-verify` only when the local build artifacts were just produced and verified.

## Rollback

Rollback is symlink-based and reuses existing release directories:

```bash
set -a; . /root/.vps-vault/credentials.env; set +a
ROLLBACK_RELEASE=<release-directory-basename> pnpm rollback:rabisu
```

The rollback script validates that `ROLLBACK_RELEASE` is a release-directory basename, switches `/opt/image-workbench/current`, restarts API/Web, and checks `/health/ready`. If health fails, it restores the previous symlink and restarts services. It does not mutate database state; schema/data rollbacks require a separate restore plan.

## Production hardening checklist

- Set stable `WORKBENCH_ADMIN_TOKEN` and use Settings to create narrower session tokens.
- Set stable `PROVIDER_SECRET_KEY` and run `pnpm --filter @image-workbench/api provider-secrets:migrate` once.
- Keep provider keys server-side; never expose provider credentials through browser env.
- Monitor `/ops` for queue backlog, failure rate, storage pressure, provider health, backup status, and audit events.
- Treat destructive gallery batch actions as production data changes and require explicit confirmation.
