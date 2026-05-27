# Operations

## Backup strategy

For the current single-VPS deployment, `STORAGE_BACKEND=local` is the recommended operating mode until remote object storage is actually needed. Back up both mutable stores:

- PostgreSQL from `DATABASE_URL`
- local image assets from `STORAGE_DIR` or `/opt/image-workbench/shared/uploads` in production

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

From the release directory on Rabisu:

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

## Restore principles

Do not blindly restore production data over a live system.

1. Take a fresh pre-restore backup first.
2. Stop `image-workbench-api` and `image-workbench-web`.
3. Restore code/config separately from mutable data.
4. Restore PostgreSQL only after explicit data-impact review.
5. Restore uploads into `STORAGE_DIR` only after checking target path and ownership.
6. Restart services and run loopback smoke checks.

## Low-memory Rabisu deployment

Rabisu currently has limited memory. Remote `tsc` or `next build` can be killed by the kernel, so production deploys use locally verified artifacts:

```bash
pnpm deploy:rabisu
```

The deployment script does the following:

1. Runs local API tests/typecheck, Web typecheck/build, production API-base guard, and Playwright smoke.
2. Builds the API locally.
3. Creates a source archive from `git archive HEAD`.
4. Creates a separate artifact archive for `apps/api/dist` and `apps/web/.next`.
5. Uploads both to Rabisu.
6. Extracts into `/opt/image-workbench/releases/<commit>-<timestamp>`.
7. Preserves runtime state through symlinks to `/opt/image-workbench/shared/.env` and `/opt/image-workbench/shared/uploads`.
8. Runs lightweight remote guards.
9. Switches `/opt/image-workbench/current`, restarts services, and smoke-tests API/Web loopback.

Useful options:

```bash
pnpm deploy:rabisu -- --skip-restart
pnpm deploy:rabisu -- --skip-local-verify
```

Use `--skip-local-verify` only when the local build artifacts were just produced and verified.
