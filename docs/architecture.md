# Architecture

Image Workbench is a modular monorepo with a Next.js Web app, a NestJS API/worker, Prisma/PostgreSQL persistence, Redis/Bull task queues, and pluggable storage/provider adapters.

```text
Browser
  |  Next.js App Router UI
  |    - Create Studio
  |    - Asset Library
  |    - Canvas
  |    - Prompt Library
  |    - Settings / Ops / Agent
  v
NestJS API
  |-- Auth/session/invite guards
  |-- Provider management + encrypted secrets
  |-- Tasks controller + SSE events
  |-- Gallery/assets/collections
  |-- Canvas projects/runs/nodes
  |-- Prompt presets/history
  |-- Agent suggestions/enhancer
  |-- Ops/health/audit endpoints
  v
Bull queue + processor
  |-- Provider adapter selection
  |-- Image generation/edit request
  |-- Image asset persistence
  |-- Canvas run-node reconciliation
  v
PostgreSQL + Redis + Storage
  |-- Prisma schema/migrations
  |-- Redis queue state
  |-- Local storage or S3/R2/MinIO-compatible object storage
```

## Backend modules

- `AuthModule`: admin/session/invite tokens, role checks, request context, audit log access/export.
- `ProvidersModule`: provider CRUD, validation, encrypted `apiKeyEnc` storage, migration support, provider health metrics.
- `TasksModule`: generate/edit task creation, queue status, reconciliation, SSE task updates, image reference validation.
- `StorageModule`: local or S3-compatible object storage, signed/redirect asset access, upload/batch upload, migration status.
- `GalleryModule`: asset search, collections, metadata, lineage, manifest/ZIP export.
- `CanvasModule`: project CRUD, templates, run records, node execution state, rerun/replay.
- `AgentModule`: local/provider prompt enhancer, creative suggestions, suggestion-to-task.
- Health/Ops controllers: readiness/version, queue controls, alerts, backup status, audit export.

## Data model highlights

- `GenerationTask`: queued generation/edit jobs with route, diagnostics, params, cost, and workspace scope.
- `ImageAsset`: stored images, thumbnails, metadata, source/derivative lineage, collection membership.
- `Provider`: server-side provider credentials encrypted when `PROVIDER_SECRET_KEY` is set.
- `CanvasProject`, `CanvasNode`, `CanvasEdge`, `CanvasRun`, `CanvasRunNode`: project graph and execution history.
- `PromptPreset`, `PromptVersion`: reusable prompt templates and history.
- `AuditLog`, `InviteToken`, `UserSession`: operational accountability and team/session UX.
- `AgentSuggestion`: persisted suggestions that can be applied to tasks or workflows.

## Deployment model

Local development uses `pnpm dev` with Web on port 3000 and API on 3100. Production on Rabisu uses copy deploy:

1. Verify and build locally.
2. Upload source and build artifacts.
3. Extract to `/opt/image-workbench/releases/<commit>-<timestamp>`.
4. Link shared `.env` and uploads.
5. Run Prisma migration.
6. Switch `/opt/image-workbench/current`.
7. Restart `image-workbench-api` and `image-workbench-web`.
8. Smoke-test health/API/Web loopback.

See `docs/operations.md` for backup, restore drill, rollback, and hardening runbooks.
