# Changelog

All notable changes to Image Workbench are documented in this file.

This project follows a practical changelog format inspired by [Keep a Changelog](https://keepachangelog.com/) and uses semantic versioning once public releases begin.

## [Unreleased]

### Added

- Productized v0.9 web UI layer: dark studio AppShell, Create Studio home, image-first Asset Library, Provider control center, Ops dashboard, and Canvas Dock/Inspector workflow.
- Product UI regression guard for Create Studio / Asset Library / Canvas language and diagnostics-only raw technical output.
- Canvas UI now includes a bottom-style action dock, minimap/controls, right-side node Inspector, node duplication, auto-save-before-run, and collapsed JSON import/export.
- Asset Library cards now emphasize images with hover actions for lightbox/download/reuse/edit/Canvas handoff instead of exposing raw asset payloads first.
- v0.8 team hardening: bootstrap/session login endpoints, HTTP-only cookie support, CSRF-protected browser mutations, session-token creation/list/revoke flows, role-based access for owner/admin/operator/viewer, and Settings page token management.
- Workspace isolation for providers, tasks, gallery assets, prompts, canvas projects, ops metrics, and audit-log reads.
- Security hardening for audit metadata, per-token/IP rate limiting, workspace-scoped uploads, and read-only viewer sessions.
- P0-P4 expansion: richer task diagnostics, forced stop, bulk retry, retry overrides, Gallery metadata, Canvas snapshots/templates/DAG ordering, workspaces/sessions, ops alerts, cost/quality metrics, and real S3-compatible storage adapter.
- Local-to-remote asset migration and orphan asset cleanup scripts.
- Optional `WORKBENCH_ADMIN_TOKEN` protection, browser bearer-token forwarding, and audit log API/page.
- Provider capability matrix with size, quality, format, API mode, output-limit, and timeout hints.
- Queue hardening with exponential retries, stale live-task recovery, running-timeout failure, failed-task listing, and usage metrics.
- Gallery batch selection/delete workflow.
- Prompt Library 2.0 history, template rendering, update/version history workflow.
- Executable Canvas workflow runner for saved task nodes with Prompt/Image upstream inputs.
- Ops page and `scripts/audit-local-assets.sh` for queue, usage, audit, and local-asset footprint checks.
- Operations runbook for backups, restore principles, and low-memory Rabisu copy deployments.
- `scripts/backup-image-workbench.sh` for timestamped PostgreSQL/upload backups with manifests, checksums, dry-run mode, and retention pruning.
- `scripts/deploy-rabisu.sh` for locally verified artifact deployment to the low-memory Rabisu VPS, including old-release pruning after successful smoke checks.
- `scripts/prune-rabisu-releases.sh` for standalone Rabisu release cleanup with dry-run support.
- Root package scripts `pnpm backup`, `pnpm deploy:rabisu`, and `pnpm prune:rabisu-releases`.
- Server-sent events task streaming through `GET /tasks/:id/events`, with web fallback polling.
- Gallery 2.0 filters, thumbnails/assets, downloads, task links, prompt reuse, and reference-image reuse.
- Konva mask editor and mask upload support for edit tasks.
- Prompt Library style templates, tag filtering, history-style reuse, and local prompt enhancer.
- React Flow Canvas workflow with Prompt/Image/Task nodes, edges, JSON import/export, task creation from canvas prompts, and persisted Canvas project CRUD.
- Backend-prefixed storage key contract for local and S3-compatible targets, plus real local WebP thumbnail generation for Gallery.
- AES-256-GCM provider secret encryption for new/updated provider records while preserving legacy plaintext readability.
- One-shot provider secret migration command for rewriting legacy plaintext keys to `enc:v1:`.
- Playwright browser E2E smoke tests for core pages and Canvas interactions.
- Professional project README covering product scope, architecture, setup, workflows, API surface, quality checks, and operational notes.
- Reference-image edit workflow:
  - Upload reference images through `POST /assets/upload`.
  - Create edit tasks through `POST /tasks/edit`.
  - Process edit jobs through OpenAI-compatible `/images/edits`.
  - Poll edit task status in the web UI and render returned images.
- Provider capability and edit-health visibility:
  - Built-in capability summaries for configured models.
  - `/images/edits` probe with tiny reference image.
  - Provider page display for generate/edit support, max references, and recent edit health.
- Provider management UI for creating, updating, enabling/disabling, testing, and seeding provider profiles from environment variables.
- Async task pipeline with Redis/BullMQ workers for image generation and editing.
- Task operations for listing, detail inspection, retrying failed/cancelled jobs, and cancelling queued jobs.
- Queue status dashboard with BullMQ counts and database status counts.
- Gallery page for recent generated assets, downloads, task links, and prompt reuse.
- Prompt library page for saving and reusing prompt presets.
- Prisma schema for provider profiles, generation tasks, image assets, canvas projects, canvas nodes/edges, and prompt presets.
- Local asset storage and image serving through `GET /assets/file`.
- Route metadata and diagnostics payloads for provider request inspection.

### Changed

- Generate/Edit/Task/Provider/Ops surfaces now prioritize decision-level status, preview, and next actions; raw API payloads moved into Diagnostics panels.
- Browser E2E smoke tests now cover the productized Create Studio, Asset Library, reference edit, and Canvas workflows.
- API tests now run against `apps/api/src` only so stale compiled `dist` spec files cannot break Vitest after local builds.
- Documented local storage plus backup as the recommended single-VPS operating model until S3/R2/MinIO resources are available.
- Replaced the temporary `image-draw-web` concept with a TypeScript monorepo based on Next.js, NestJS, Prisma, Redis, BullMQ, and pnpm/Turborepo.
- Generation requests now run through queued tasks instead of synchronous browser-bound requests.
- Generate UI now streams task status with SSE and falls back to polling when the connection is unavailable.
- Task detail and Gallery flows now support reusing prompts and generation parameters.
- Provider keys are submitted only to the server and shown in the UI as masked values.

### Fixed

- Ops dashboard now reads the real metrics API contract (`byStatus`, `byModel`, `images.sizeBytes`) so status/model/storage cards do not render as empty.
- Reference-image edit upload now stores namespaced local uploads in the correct workspace directory and accepts freshly uploaded workspace refs before they are attached to generated gallery assets.
- Edit page upload/mask upload now uses authenticated API helpers with CSRF headers; provider detection uses the same API helper.
- Mask drawing now uses the correct React/Konva pointer-move handler.
- Canvas editing now has a side-panel node editor for Prompt/Image/Task data, saves unsaved graphs before execution, and runs Image-reference upstream nodes as edit tasks.
- Reconciled stale `RUNNING` tasks that already have persisted image assets so tasks interrupted between provider success and final status update are shown as `SUCCEEDED`.
- Avoided Prisma write failures when persisting generated images by storing runtime-only asset URLs and thumbnail metadata under `metadataJson` instead of top-level `ImageAsset` fields.
- Classified common upstream edit failures for easier troubleshooting.
- Parsed mixed provider error payloads more defensively, including malformed JSON/SSE-like responses.
- Bound API host configuration from environment for deployment scenarios.
- Added internal API base support for server-side rendering and deployment routing.
- Ignored TypeScript build-info artifacts to keep the repository clean.

### Security

- Documented that provider API keys must remain server-side and must not be committed.
- Provider API keys are encrypted-at-rest for new and updated database records with `enc:v1:` AES-256-GCM payloads.
- Confirmed runtime data, local uploads, logs, `.env`, and `.env.local` are ignored by Git.

## [0.1.0] - 2026-05-27

### Added

- Initial Image Workbench monorepo scaffold.
- Next.js web application shell.
- NestJS API application shell.
- Shared TypeScript packages for schemas, provider helpers, and image utilities.
- Docker Compose infrastructure for local PostgreSQL and Redis.
- Initial README with target stack and package layout.
