# Roadmap

## Completed in the v0.2 continuous implementation slice

- Provider validation returns structured 400 errors instead of generic server errors.
- Production API-base guard prevents stale browser chunks from calling `localhost:3100`.
- SSE task updates are available through `GET /tasks/:id/events`; web UIs fall back to polling when SSE is unavailable.
- Gallery 2.0 lists thumbnails/assets with filters, downloads, prompt reuse, task links, and reference-image reuse.
- Gallery now generates real local WebP thumbnails at asset write time and stores `thumbnailKey` for fast browsing.
- Generated/gallery images can be reused as edit references.
- Edit workflow supports mask upload and a Konva-based mask editor.
- Prompt Library supports seed style templates, tag filtering, history-style reuse, and local prompt enhancement.
- React Flow Canvas supports Prompt/Image/Task nodes, reference edges, JSON import/export, and task creation from canvas prompt nodes.
- Canvas projects are persisted through API/database CRUD (`/canvas-projects`) with saved nodes and edges.
- Storage keys use a backend-prefixed contract for local and S3-compatible targets (`local://`, `s3://`, `r2://`, `minio://`).
- Provider secrets are encrypted at rest for new/updated records while legacy plaintext remains readable for migration compatibility.
- Legacy plaintext provider keys can be migrated with `pnpm --filter @image-workbench/api provider-secrets:migrate` after setting a stable `PROVIDER_SECRET_KEY`.
- Browser E2E smoke coverage is available through Playwright for core pages and Canvas interactions.

- Optional admin-token API protection and recent audit-log viewing are implemented.
- Provider capability metadata now includes sizes, qualities, formats, API modes, output limits, and timeout hints.
- Queue reliability includes retries with exponential backoff, stale live-task requeue, running timeout failure, failed-task listing, and metrics summary.
- Gallery supports batch selection/delete actions.
- Prompt Library 2.0 supports task prompt history, template variable rendering, prompt updates, and version history.
- Canvas projects can execute saved task nodes from connected Prompt/Image nodes and write task ids back into node data.
- Ops page exposes queue, usage metrics, and audit logs; `scripts/audit-local-assets.sh` summarizes local asset footprint.

## Suggested near-term operating model

- Keep `STORAGE_BACKEND=local` on the single VPS deployment unless R2/S3/MinIO credentials are ready.
- Back up `STORAGE_DIR` regularly together with PostgreSQL.
- Switch to `STORAGE_BACKEND=s3|r2|minio` when image volume or disk pressure justifies remote storage.


## Completed in the v0.3-v0.7 P0-P4 expansion

- P0 reliability UX: diagnostic packages, retry overrides, bulk retry, force-stop, Gallery favorites/tags/ratings, and save-from-task prompts.
- P1 Canvas engine: snapshots, templates, DAG task ordering, and upstream output reference propagation.
- P2 team groundwork: Workspace and UserSession tables, token-derived session tracking, and workspace API surfaces.
- P3 operations: cost/quality summary metrics and alert endpoint for queue backlog, high failure rate, and storage pressure.
- P4 storage: real S3-compatible write/read/signed-url path for S3/R2/MinIO, plus migration and orphan cleanup scripts.


## Completed in v0.8 team hardening

- Public login endpoint for bootstrap/admin tokens and persisted session tokens.
- Session token management: create, list, revoke, label, role, expiry metadata.
- Role model: owner/admin/operator/viewer with viewer read-only behavior and admin-only high-risk operations.
- Workspace isolation across providers, tasks, gallery assets, prompts, canvas projects, ops metrics, and audit logs.
- Audit metadata now captures workspace, actor role/label, token hash, IP, and user agent.
- Upload/reference assets are namespaced by workspace to prevent accidental cross-workspace preview access.
- Settings page exposes current auth context, workspace list, browser token save, and session-token management.

## Completed in v0.9 product UI refactor

- Dark premium AppShell with persistent product navigation, studio surfaces, shared cards, pills, metrics, notices, diagnostics, and image-first components.
- Create Studio home page with prompt controls, PreviewStage, image action toolbar, SSE/polling task state, and raw task responses hidden in Diagnostics.
- Reference edit workspace with provider-readiness notice, reference strip, Mask editor, PreviewStage output actions, and authenticated upload/task helpers.
- Asset Library gallery with masonry-style cards, lightbox/download/reuse/edit/Canvas actions, filtering, and batch action entrypoint.
- Tasks, Task Detail, Providers, and Ops pages now present decision-level state first and collapse engineering payloads into Diagnostics.
- Canvas workflow now has a Canvas Dock, right-side Inspector, minimap/controls, node duplication, auto-save-before-run, and collapsed JSON import/export.
- Product UI regression guard (`apps/web/product-ui-contract.test.js`) prevents a return to debug-first pages or missing studio/library/canvas language.
- E2E smoke tests were updated for the productized Create Studio, Asset Library, reference edit, and Canvas workflows.

## Next recommended slice: v1.0 production readiness and Canvas professional workflow

- Enable production authentication by setting a stable `WORKBENCH_ADMIN_TOKEN` and `PROVIDER_SECRET_KEY`, then migrate provider secrets.
- Add formal health endpoints: `/health/live`, `/health/ready`, and `/health/version` for deploy and monitoring checks.
- Enable scheduled Rabisu backups and perform a documented restore drill for PostgreSQL plus local uploads.
- Add CI to run typecheck, API tests, web tests, Playwright E2E, build, and the production API-base guard.
- Persist Canvas run records and node-level execution state.
- Add partial node rerun and run replay/copy workflows.
- Expand built-in Canvas templates and make template-to-project creation first-class.
- Show live node progress and result thumbnails directly on the Canvas.
