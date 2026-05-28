# Image Workbench

Image Workbench is a private, production-oriented AI image creation workbench for GPT Image 2 and OpenAI-compatible image providers. It replaces the temporary `image-draw-web` FastAPI demo with a TypeScript monorepo, queued generation pipeline, provider management, SSE task diagnostics, gallery, prompt library, mask editing, React Flow canvas workflows, S3-compatible storage-key contracts, and encrypted provider secrets, optional admin-token protection, audit logs, usage metrics, batch gallery actions, prompt versioning, and executable canvas workflows.

## What it does

- Generate images through OpenAI-compatible `/images/generations` or `/responses` routes.
- Edit images with uploaded reference images through `/images/edits`.
- Queue long-running image jobs with Redis and BullMQ instead of blocking browser requests.
- Store task metadata, provider profiles, route diagnostics, errors, and image assets in PostgreSQL via Prisma.
- Serve generated/uploaded assets from local storage with backend-prefixed keys that are compatible with S3, R2, and MinIO object stores.
- Manage providers from the UI, including masked keys, model capability summaries, `/models` checks, and `/images/edits` probes.
- Inspect tasks, retry failed/cancelled jobs, cancel queued jobs, reuse prompts/parameters, and browse outputs in Gallery.
- Maintain reusable prompt presets for recurring styles and workflows.

## Current status

This project is in active `0.2.x` development. The core generate/edit pipeline, SSE status updates, Gallery 2.0 with generated thumbnails, prompt workflows, mask editing, persisted Canvas projects, backend-prefixed storage keys, provider secret encryption, one-shot legacy key migration, and browser E2E smoke tests are implemented. S3/R2/MinIO remote-object adapters are implemented and configurable; single-VPS deployments can continue using local storage until object-storage credentials are configured.

Implemented:

- Next.js web UI with pages for Generate, Edit, Tasks, Task Detail, Gallery, Providers, Prompts, and Canvas.
- NestJS API with provider, task, gallery, asset, and prompt modules.
- PostgreSQL schema for providers, generation tasks, image assets, canvas projects/nodes/edges, and prompt presets.
- Redis/BullMQ worker for async image generation and editing.
- SSE task updates with polling fallback.
- Local image upload, asset serving, metadata extraction, generated WebP thumbnails, and S3/R2/MinIO-compatible storage key contracts.
- Provider diagnostics, encrypted provider secrets, one-shot legacy plaintext key migration, and error classification for common upstream failures.
- Persisted React Flow canvas projects and Konva mask editor.

Planned:

- Multi-user hardening beyond workspace/session groundwork, if public team access is required.

## Architecture

```text
apps/web  ──HTTP──>  apps/api  ──Prisma──> PostgreSQL
   │                    │
   │                    ├─BullMQ──> Redis
   │                    │
   │                    ├─Worker──> OpenAI-compatible image provider
   │                    │
   │                    └─Storage──> local filesystem data/uploads or S3-compatible object keys
   │
   └─Next.js UI: generate, edit, tasks, gallery, providers, prompts, canvas
```

## Stack

- **Web:** Next.js, React, TypeScript
- **API:** NestJS, TypeScript
- **Database:** PostgreSQL, Prisma
- **Queue:** Redis, BullMQ
- **Storage:** Local filesystem with S3/R2/MinIO-compatible key contract
- **Image utilities:** Sharp
- **Monorepo tooling:** pnpm, Turborepo
- **Canvas:** React Flow, Konva
- **Testing:** Vitest, Node test runner, Playwright
- **Deployment target:** Docker Compose and reverse proxy/Nginx

## Repository layout

```text
apps/
  api/                 NestJS API, worker, Prisma schema
  web/                 Next.js UI
packages/
  shared/              Shared request schemas and types
  provider-sdk/        Provider routing and model capability helpers
  image-utils/         Image metadata helpers
infra/
  docker-compose.yml   Local PostgreSQL and Redis infrastructure
docs/
  architecture.md      Architecture notes
  roadmap.md           Development roadmap
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker and Docker Compose for local PostgreSQL/Redis
- An OpenAI-compatible image API provider key

## Configuration

Copy the example environment file and fill in provider credentials:

```bash
cp .env.example .env.local
```

Key variables:

```env
API_PORT=3100
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://image:***@localhost:5432/image_workbench
REDIS_HOST=localhost
REDIS_PORT=6379
STORAGE_BACKEND=local
STORAGE_DIR=./data/uploads
STORAGE_BUCKET=image-workbench
STORAGE_PUBLIC_BASE_URL=
S3_ENDPOINT=
S3_REGION=auto
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
PROVIDER_SECRET_KEY=64_HEX_CHARS_FOR_AES_256_GCM
WORKBENCH_ADMIN_TOKEN=optional_admin_token_for_api
NEXT_PUBLIC_WORKBENCH_TOKEN=optional_admin_token_for_browser
IMAGE_API_BASE=https://api.example.com/v1
IMAGE_API_KEY=YOUR_PROVIDER_API_KEY
IMAGE_MODEL=gpt-image-2
```

Notes:

- Keep API keys server-side only. Do not expose provider keys to the browser.
- `.env.local` is ignored by Git.
- Provider records created in the UI are stored in the database. New and updated provider keys are encrypted-at-rest with AES-256-GCM and stored with an `enc:v1:` prefix; legacy plaintext values remain readable for migration compatibility.
- Until S3/R2/MinIO resources are available, keep `STORAGE_BACKEND=local` and back up `STORAGE_DIR`. This is the recommended low-cost production mode for a single VPS.

## Local development

Install dependencies:

```bash
pnpm install
```

Start PostgreSQL and Redis:

```bash
pnpm infra:up
```

Generate Prisma client and apply migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

Run API and web apps:

```bash
pnpm dev
```

Useful individual commands:

```bash
pnpm dev:api
pnpm dev:web
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3100`

## Common workflows

### Create or sync a provider

1. Open `Providers`.
2. Add a provider manually, or use the environment-provider seed action to sync from environment variables.
3. Run the `/models` test to verify the base URL and key.
4. Run the `/images/edits` probe to verify reference-image edit support.

### Generate an image

1. Open `Generate`.
2. Enter prompt/model/size/quality/format/API mode.
3. Submit the task.
4. The UI streams task status over SSE and shows the result image when complete.
5. Use `Tasks` for route diagnostics and `Gallery` for output history.

### Edit with reference images

1. Open `Edit`.
2. Upload one or more reference images.
3. Write the edit prompt.
4. Optionally draw or upload a mask.
5. Submit the edit task.
6. The UI streams `/tasks/:id/events` and renders returned images when the task reaches a terminal state.

### Save a Canvas workflow

1. Open `Canvas`.
2. Add Prompt/Image/Task nodes and connect them.
3. Enter a project name and click `新建保存` or `保存项目`.
4. Use `加载项目列表` to reopen saved workflows later.
5. Click `执行画布任务` to run saved Task nodes; connected Prompt/Image nodes become generate/edit task inputs.

### Migrate legacy provider secrets

After setting a stable production `PROVIDER_SECRET_KEY`, dry-run and then rewrite legacy plaintext provider keys:

```bash
pnpm --filter @image-workbench/api provider-secrets:migrate -- --dry-run
pnpm --filter @image-workbench/api provider-secrets:migrate
```

The command skips existing `enc:v1:` values and only rewrites plaintext rows.

### Diagnose failures

- `Tasks` shows queue status and recent task states.
- `Task Detail` shows route metadata, request parameters, diagnostics, error messages, and generated images.
- Failed or cancelled tasks can be retried.
- Queued tasks can be cancelled safely.

## API overview

Main endpoints:

- `POST /tasks/generate` — create an image generation task.
- `POST /tasks/edit` — create a reference-image edit task.
- `GET /tasks` — list recent tasks.
- `GET /tasks/:id` — get task detail with images and diagnostics.
- `GET /tasks/:id/events` — stream task snapshots with Server-Sent Events.
- `POST /tasks/:id/retry` — requeue a failed/cancelled task.
- `POST /tasks/:id/cancel` — cancel a queued task.
- `GET /tasks/queue/status` — inspect queue and database status counts.
- `GET /tasks/failed` — list failed/dead-letter style tasks.
- `GET /tasks/metrics/summary` — usage metrics by status/model and image storage totals.
- `GET /audit-logs` — recent audit events.
- `POST /gallery/batch/delete` — batch delete image asset database rows.
- `GET /prompts/history`, `PATCH /prompts/:id`, `GET /prompts/:id/versions`, `POST /prompts/:id/render` — prompt history, versioning, and template variables.
- `POST /canvas-projects/:id/run` — execute saved canvas Task nodes and write task ids back to the graph.
- `GET /gallery` — list recent image assets.
- `GET /assets/file?key=***` — serve a stored image asset.
- `POST /assets/upload` — upload a reference image.
- `GET /canvas-projects` — list saved Canvas projects.
- `POST /canvas-projects` — create a Canvas project with nodes and edges.
- `GET /canvas-projects/:id` — open a saved Canvas project.
- `PATCH /canvas-projects/:id` — replace Canvas project graph state.
- `DELETE /canvas-projects/:id` — delete a saved Canvas project.
- `GET /providers` — list provider profiles with capabilities and edit health.
- `POST /providers` — create a provider profile.
- `PATCH /providers/:id` — update provider profile fields.
- `DELETE /providers/:id` — remove a provider profile.
- `POST /providers/:id/test` — test provider `/models`.
- `POST /providers/:id/test-edit` — test provider `/images/edits`.
- `POST /providers/seed-env` — seed a provider from environment variables.

## Quality checks

Run type checks across the monorepo:

```bash
pnpm typecheck
```

Run package tests:

```bash
pnpm test
```

Build all apps/packages:

```bash
pnpm build
```

Run browser E2E smoke tests:

```bash
pnpm --filter @image-workbench/web test:e2e
```

Verify production browser chunks do not contain a localhost API fallback:

```bash
pnpm --filter @image-workbench/web build
pnpm --filter @image-workbench/web test -- api-base.production.test.js
```

Deployment note: when frontend source changes, sync both `apps/web/lib/*` and a clean rebuilt `apps/web/.next/` directory. Do not overlay a stale `.next` build; stale chunks can make the browser call `http://localhost:3100` and produce `TypeError: Load failed`.

## Security and operational notes

- Never commit `.env`, `.env.local`, generated uploads, logs, or local runtime data.
- Provider API keys must remain server-side and are encrypted-at-rest for new/updated database records.
- Set a stable `PROVIDER_SECRET_KEY` before production writes; changing it makes existing `enc:v1:` keys undecryptable.
- Generated assets are stored under `STORAGE_DIR` for `STORAGE_BACKEND=local`; back this directory up if image outputs are important.
- Long-running tasks depend on Redis and the BullMQ worker being online.

## Documentation

- [Architecture](docs/architecture.md)
- [Operations](docs/operations.md)
- [Roadmap](docs/roadmap.md)
- [Changelog](CHANGELOG.md)
