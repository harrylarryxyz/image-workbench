# Image Workbench

Image Workbench is a private, production-oriented AI image creation workbench for GPT Image 2 and OpenAI-compatible image providers. It replaces the temporary `image-draw-web` FastAPI demo with a TypeScript monorepo, queued generation pipeline, provider management, task diagnostics, gallery, prompt library, and a roadmap toward node-based canvas workflows.

## What it does

- Generate images through OpenAI-compatible `/images/generations` or `/responses` routes.
- Edit images with uploaded reference images through `/images/edits`.
- Queue long-running image jobs with Redis and BullMQ instead of blocking browser requests.
- Store task metadata, provider profiles, route diagnostics, errors, and image assets in PostgreSQL via Prisma.
- Serve generated/uploaded assets from local storage with an abstraction that can later move to S3-compatible storage.
- Manage providers from the UI, including masked keys, model capability summaries, `/models` checks, and `/images/edits` probes.
- Inspect tasks, retry failed/cancelled jobs, cancel queued jobs, reuse prompts/parameters, and browse outputs in Gallery.
- Maintain reusable prompt presets for recurring styles and workflows.

## Current status

This project is in active `0.1.x` development. The core generate/edit pipeline is functional; canvas workflows and S3-compatible storage are planned but not implemented yet.

Implemented:

- Next.js web UI with pages for Generate, Edit, Tasks, Task Detail, Gallery, Providers, Prompts, and Canvas roadmap.
- NestJS API with provider, task, gallery, asset, and prompt modules.
- PostgreSQL schema for providers, generation tasks, image assets, canvas projects/nodes/edges, and prompt presets.
- Redis/BullMQ worker for async image generation and editing.
- Local image upload, asset serving, and metadata extraction.
- Provider diagnostics and error classification for common upstream failures.

Planned:

- Server-sent events or websocket task updates.
- Thumbnail generation and richer gallery filtering.
- Mask upload and Konva-based mask editing.
- React Flow canvas projects with prompt/image/task nodes.
- S3/R2/MinIO storage backend.
- Provider secret encryption at rest.

## Architecture

```text
apps/web  ──HTTP──>  apps/api  ──Prisma──> PostgreSQL
   │                    │
   │                    ├─BullMQ──> Redis
   │                    │
   │                    ├─Worker──> OpenAI-compatible image provider
   │                    │
   │                    └─Storage──> local filesystem data/uploads
   │
   └─Next.js UI: generate, edit, tasks, gallery, providers, prompts
```

## Stack

- **Web:** Next.js, React, TypeScript
- **API:** NestJS, TypeScript
- **Database:** PostgreSQL, Prisma
- **Queue:** Redis, BullMQ
- **Storage:** Local filesystem first; S3-compatible storage planned
- **Image utilities:** Sharp
- **Monorepo tooling:** pnpm, Turborepo
- **Canvas roadmap:** React Flow, Konva
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
STORAGE_DIR=./data/uploads
IMAGE_API_BASE=https://api.example.com/v1
IMAGE_API_KEY=YOUR_PROVIDER_API_KEY
IMAGE_MODEL=gpt-image-2
```

Notes:

- Keep API keys server-side only. Do not expose provider keys to the browser.
- `.env.local` is ignored by Git.
- Provider records created in the UI are stored in the database. The current `apiKeyEncrypted` field stores the configured key value; encryption-at-rest is still planned.

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
4. The UI polls task status and shows the result image when complete.
5. Use `Tasks` for route diagnostics and `Gallery` for output history.

### Edit with reference images

1. Open `Edit`.
2. Upload one or more reference images.
3. Write the edit prompt.
4. Submit the edit task.
5. The UI polls `/tasks/:id` and renders returned images when the task reaches a terminal state.

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
- `POST /tasks/:id/retry` — requeue a failed/cancelled task.
- `POST /tasks/:id/cancel` — cancel a queued task.
- `GET /tasks/queue/status` — inspect queue and database status counts.
- `GET /gallery` — list recent image assets.
- `GET /assets/file?key=***` — serve a stored image asset.
- `POST /assets/upload` — upload a reference image.
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

## Security and operational notes

- Never commit `.env`, `.env.local`, generated uploads, logs, or local runtime data.
- Provider API keys must remain server-side.
- The local provider key storage field is not yet encrypted; use trusted private deployments until encryption-at-rest is implemented.
- Generated assets are stored under `STORAGE_DIR`; back this directory up if image outputs are important.
- Long-running tasks depend on Redis and the BullMQ worker being online.

## Documentation

- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Changelog](CHANGELOG.md)
