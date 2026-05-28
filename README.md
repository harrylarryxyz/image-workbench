# Image Workbench

Image Workbench is a private, production-oriented AI image creation studio for GPT Image 2 and OpenAI-compatible image providers. It replaces the temporary `image-draw-web` FastAPI demo with a TypeScript monorepo, queued generation pipeline, productized Create Studio, Asset Library, Provider control center, SSE task diagnostics, prompt library, mask editing, React Flow canvas workflows, S3-compatible storage-key contracts, encrypted provider secrets, optional admin-token protection, audit logs, usage metrics, batch gallery actions, prompt versioning, and executable canvas workflows.

## What it does

- Generate images through OpenAI-compatible `/images/generations` or `/responses` routes.
- Edit images with uploaded reference images through `/images/edits`.
- Queue long-running image jobs with Redis and BullMQ instead of blocking browser requests.
- Store task metadata, provider profiles, route diagnostics, errors, and image assets in PostgreSQL via Prisma.
- Serve generated/uploaded assets from local storage with backend-prefixed keys that are compatible with S3, R2, and MinIO object stores.
- Manage providers from the UI, including masked keys, model capability summaries, `/models` checks, and `/images/edits` probes.
- Inspect tasks, retry failed/cancelled jobs, cancel queued jobs, reuse prompts/parameters, and browse outputs in an image-first Asset Library.
- Maintain reusable prompt presets for recurring styles and workflows.

## Current status

This project is in active `0.9.x` productization work. The core generate/edit pipeline, SSE status updates, productized Create Studio, Asset Library with generated thumbnails, prompt workflows, mask editing, persisted Canvas projects, backend-prefixed storage keys, provider secret encryption, one-shot legacy key migration, and browser E2E smoke tests are implemented. S3/R2/MinIO remote-object adapters are implemented and configurable; single-VPS deployments can continue using local storage until object-storage credentials are configured.

Implemented:

- Next.js web UI with a dark studio AppShell, Create Studio, Edit workspace, Asset Library, Tasks, Task Detail, Provider control center, Prompts, Ops, Settings, and Canvas.
- NestJS API with provider, task, gallery, asset, and prompt modules.
- PostgreSQL schema for providers, generation tasks, image assets, canvas projects/nodes/edges, and prompt presets.
- Redis/BullMQ worker for async image generation and editing.
- SSE task updates with polling fallback.
- Local image upload, asset serving, metadata extraction, generated WebP thumbnails, and S3/R2/MinIO-compatible storage key contracts.
- Provider diagnostics, encrypted provider secrets, one-shot legacy plaintext key migration, and error classification for common upstream failures.
- Persisted React Flow canvas projects, Canvas Dock/Inspector workflow, and Konva mask editor.

Planned:

- Canvas run history with node-level execution state, rerun/replay, and live output thumbnails.
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
   └─Next.js UI: Create Studio, Edit, Asset Library, Tasks, Providers, Prompts, Canvas, Ops
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
WORKBENCH_RATE_LIMIT_PER_MINUTE=240
NEXT_PUBLIC_WORKBENCH_TOKEN=optional_session_token_for_internal_browser
NEXT_PUBLIC_WORKSPACE_ID=default
IMAGE_API_BASE=https://api.example.com/v1
IMAGE_API_KEY=YOUR_PROVIDER_API_KEY
IMAGE_MODEL=gpt-image-2
```

Notes:

- Keep API keys server-side only. Do not expose provider keys to the browser.
- `.env.local` is ignored by Git.
- Provider records created in the UI are stored in the database. New and updated provider keys are encrypted-at-rest with AES-256-GCM and stored with an `enc:v1:` prefix; legacy plaintext values remain readable for migration compatibility.
- Use `WORKBENCH_ADMIN_TOKEN` as the server-only bootstrap owner token. Browser users should open `Settings`, login with the bootstrap/session token, and then operate through the HttpOnly session cookie plus CSRF header.
- Create narrower session tokens from `Settings` or `POST /auth/tokens`; avoid exposing the bootstrap token through `NEXT_PUBLIC_*` unless this is a trusted private deployment.
- Open `Settings` to inspect the current auth context, save a browser token, and manage workspace session tokens.
- Keep `STORAGE_BACKEND=local` on a single VPS unless R2/S3/MinIO credentials are ready; remote storage can be enabled through the S3-compatible variables above.

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

### Generate an image in Create Studio

1. Open `Studio`.
2. Enter prompt/model/size/quality/format/API mode.
3. Submit the task.
4. PreviewStage streams task status over SSE and shows the result image when complete.
5. Use the image action toolbar for download, continued editing, Canvas handoff, or task diagnostics.

### Edit with reference images

1. Open `Edit`.
2. Upload one or more reference images.
3. Write the edit prompt.
4. Optionally draw or upload a mask.
5. Submit the edit task.
6. PreviewStage streams `/tasks/:id/events`, renders returned images, and exposes download / continue-edit / Canvas actions.

### Save a Canvas workflow

1. Open `Canvas`.
2. Use the Canvas Dock to add Prompt/Image/Task nodes and connect them.
3. Use the right Inspector to edit project name, prompt text, image storage keys, model, size, and quality.
4. Enter a project name and click `新建保存` or `保存项目`.
5. Click `执行画布任务` to auto-save and run saved Task nodes; connected Prompt/Image nodes become generate/edit task inputs.
6. Import/export JSON is available under a collapsed diagnostics-style panel so the main canvas stays visual.

### Migrate legacy provider secrets

After setting a stable production `PROVIDER_SECRET_KEY`, dry-run and then rewrite legacy plaintext provider keys:

```bash
pnpm --filter @image-workbench/api provider-secrets:migrate -- --dry-run
pnpm --filter @image-workbench/api provider-secrets:migrate
```

The command skips existing `enc:v1:` values and only rewrites plaintext rows.

### Diagnose failures

- `Tasks` shows queue status and recent task states with raw payloads tucked into Diagnostics.
- `Task Detail` shows status, generated images, actions, and a Diagnostics panel for route metadata, request parameters, and raw image payloads.
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
- `GET /auth/me`, `POST /auth/login`, `POST /auth/logout` — inspect/login/logout with bootstrap or session tokens.
- `GET /auth/tokens`, `POST /auth/tokens`, `POST /auth/tokens/:id/revoke` — manage workspace session tokens.
- `GET /workspaces`, `GET /workspaces/me`, `POST /workspaces` — inspect and create workspaces.
- `GET /tasks/metrics/summary` — usage metrics by status/model and image storage totals.
- `GET /audit-logs` — recent workspace-scoped audit events.
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
- Session roles are `owner`, `admin`, `operator`, and `viewer`; viewers are read-only, operators can run normal workflows, and admin/owner roles manage providers, workspaces, tokens, and deletes.
- Workspace-scoped API requests use bearer tokens plus optional `x-workspace-id`; generated tasks/assets/prompts/canvases inherit the resolved workspace context.
- Audit logs include workspace, actor label/role, token hash, IP, and user agent for high-risk operations.

## Documentation

- [Architecture](docs/architecture.md)
- [Operations](docs/operations.md)
- [Roadmap](docs/roadmap.md)
- [Changelog](CHANGELOG.md)
