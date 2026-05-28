# Image Workbench

Image Workbench is a production-oriented AI image generation and editing workbench. It combines provider routing, encrypted provider credentials, realtime task progress, an asset library, mask/reference editing, prompt workflows, React Flow canvases, team/session controls, and operations tooling for a single-VPS deployment.

The current implementation covers the v0.2 roadmap slice through v15: production readiness, Canvas professional workflows, Create Studio 2.0, Asset Library 2.0, team/ops controls, and a creative Agent surface.

## What is included

- **Create Studio**: generate, edit, reference image, mask, prompt variants, version/source lineage, before/after comparison, and `@image(storageKey)` reference extraction.
- **Realtime tasks**: Server-Sent Events for task progress with polling fallback.
- **Provider routing**: OpenAI-compatible image routes, validation, provider health/quota views, and encrypted provider API keys.
- **Asset Library 2.0**: search, filters, thumbnails, lightbox/detail, collections, tags/favorites/ratings, lineage, manifest/ZIP download, and reusable image references.
- **Canvas workflows**: React Flow projects, templates, template-to-project, run records, node execution state, rerun/replay, Agent next-step suggestions, and live result thumbnails.
- **Prompt Library**: tags, style templates, history, local prompt enhancer, and optional provider-backed Agent enhancer.
- **Mask workflow**: upload masks and draw masks in the browser with Konva.
- **Storage**: local storage by default with S3/R2/MinIO-compatible backend support and local-to-remote migration status.
- **Team and operations**: invite/session token UX, role checks, audit filter/export, queue controls, storage alerts, backup/restore/rollback helpers, health/version endpoints, and a CI quality-gate template.

## Repository layout

```text
apps/
  api/                 NestJS API, Bull worker, Prisma schema/migrations
  web/                 Next.js App Router UI
  worker/              reserved worker package
packages/
  schemas/             shared request/response schemas
  provider-adapters/   provider routing/adapters
docs/
  architecture.md      high-level architecture
  operations.md        backup/restore/health/deploy/rollback runbooks
  roadmap.md           completed and next roadmap slices
scripts/
  deploy-rabisu.sh     low-memory copy deploy for Rabisu
  backup-rabisu.sh     remote backup helper
  restore-rabisu-backup.sh
  rollback-rabisu.sh
infra/
  docker-compose.yml   local Postgres/Redis helpers
```

## Prerequisites

- Node.js 22+
- pnpm 10.33+
- PostgreSQL 16+
- Redis 7+
- Optional: S3/R2/MinIO credentials for remote object storage

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm infra:up
pnpm --filter @image-workbench/api prisma:migrate
pnpm dev
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3100`
- Health: `http://localhost:3100/health/live`

## Core environment

```bash
DATABASE_URL=postgresql://workbench:workbench@localhost:5432/image_workbench
REDIS_HOST=localhost
REDIS_PORT=6379
WORKBENCH_ADMIN_TOKEN=change-me
PROVIDER_SECRET_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
IMAGE_API_MODE=auto
STORAGE_BACKEND=local
STORAGE_DIR=./data/uploads
```

Remote object storage uses the same application API:

```bash
STORAGE_BACKEND=s3       # s3, r2, or minio
STORAGE_BUCKET=image-workbench
S3_ENDPOINT=https://example.invalid
S3_REGION=auto
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
STORAGE_PUBLIC_BASE_URL= # optional CDN/base URL
```

Do not expose provider credentials or storage credentials through browser environment variables.

## API highlights

- `GET /health/live`, `/health/ready`, `/health/version`
- `POST /tasks/generate`, `POST /tasks/edit`, `GET /tasks/:id/events`
- `GET /gallery`, `GET /gallery/:id`, `POST /gallery/collections`, `GET /gallery/batch/download.zip`
- `POST /assets/upload`, `POST /assets/upload/batch`, `GET /assets/status`, `POST /assets/migration/local-to-remote`
- `GET/POST/PATCH /canvas-projects`, `POST /canvas-projects/:id/run`, `POST /canvas-projects/:id/runs/:runId/replay`
- `POST /agent/suggestions`, `POST /agent/canvas/next-step`, `POST /agent/enhance`, `POST /agent/suggestions/:id/apply`
- `GET /ops/queue/status`, `/ops/alerts`, `/ops/export/audit`

## Verification

Run the same quality gates used before deploy. A GitHub Actions template is available at `docs/ci/quality.yml`; copy it to `.github/workflows/quality.yml` using credentials that have GitHub `workflow` scope when enabling CI:

```bash
pnpm --filter @image-workbench/api prisma:generate
pnpm --filter @image-workbench/api exec prisma validate --schema prisma/schema.prisma
pnpm --filter @image-workbench/api test
pnpm --filter @image-workbench/api typecheck
pnpm --filter @image-workbench/web typecheck
pnpm --filter @image-workbench/web test
pnpm --filter @image-workbench/web test:e2e
pnpm --filter @image-workbench/api build
pnpm --filter @image-workbench/web build
node apps/web/api-base.production.test.js
bash -n scripts/*.sh
```

The production Web build must not contain browser calls to `localhost:3100`; `apps/web/api-base.production.test.js` guards this.

## Production deployment: Rabisu

Rabisu uses a copy-deploy model, not `git checkout` on the server. Build and verify locally, upload source/build artifacts, then switch the `current` symlink.

```bash
set -a; . /root/.vps-vault/credentials.env; set +a
pnpm deploy:rabisu
```

The deploy script verifies API/Web locally, uploads artifacts, runs Prisma migration, restarts `image-workbench-api` and `image-workbench-web`, and checks API/Web/health loopback.

Useful operational commands:

```bash
pnpm backup:rabisu
RESTORE_MANIFEST=/opt/image-workbench/backups/data/latest-manifest.json pnpm restore:rabisu
ROLLBACK_RELEASE=<release-basename> pnpm rollback:rabisu
```

See `docs/operations.md` for the full runbook.

## Security model

- Admin and session access use server-side bearer/cookie tokens.
- Provider API keys are encrypted at rest when `PROVIDER_SECRET_KEY` is set.
- Invite/session tokens are hashed before storage.
- `/health/ready` is public but intentionally redacted: it reports readiness states, not paths, credentials, or provider secret fingerprints.
- Gallery lineage and collection actions are workspace-scoped.
- Destructive actions are surfaced through explicit confirmation flows.

## Secret migration

After setting a stable `PROVIDER_SECRET_KEY`, run the provider secret migration once from a trusted maintenance shell:

```bash
pnpm --filter @image-workbench/api provider-secrets:migrate
```

Before migration:

1. Take a fresh backup.
2. Confirm the key is stable and stored in production secrets.
3. Run the migration.
4. Restart API workers.
5. Create a provider validation task and confirm it succeeds.

## Development notes

- Keep local development API base at `http://localhost:3100`.
- Production routing should go through `/api` behind nginx; the production build guard catches regressions.
- Use SSE first for task status, polling only as fallback.
- Keep provider-specific private endpoints out of public docs.
