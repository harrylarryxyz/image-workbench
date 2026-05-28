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

## Completed in v1.0-v1.5 full productization wave

### v1.0 production readiness

- Added public `/health/live`, `/health/ready`, and `/health/version` endpoints for deploy and monitoring checks.
- Readiness checks now validate database, Redis, storage adapter, auth token configuration, and provider secret-key configuration.
- Added a GitHub Actions quality-gate template at `docs/ci/quality.yml` for API tests/typecheck, Prisma validation, Web typecheck/tests, production build, API-base guard, Playwright E2E, and deploy script syntax checks. It can be installed under `.github/workflows/quality.yml` with a token that has `workflow` scope.
- Added Rabisu backup, restore-drill, and rollback helper scripts plus package shortcuts.
- Deployment smoke now verifies health/version endpoints before accepting a release.
- Settings now supports one-time invite links and Cookie-session login in addition to browser token compatibility.

### v1.1 Canvas professional workflow

- CanvasRun and CanvasRunNode tables persist every graph execution with node-level status, task ids, inputs, outputs, and image thumbnails.
- Canvas UI lists historical runs, shows live result thumbnails from run nodes, supports single-node rerun, and can replay a previous run snapshot.
- Template projects can be saved and instantiated as editable projects.
- Canvas Inspector now exposes generation/edit config, mask key, upstream prompt/reference wiring, and Agent next-step suggestions.

### v1.2 Create Studio 2.0

- Studio unifies text generation and reference-image edit flow: adding a reference key or `@image(storageKey)` switches to edit-task creation.
- Prompt variants are available from the Studio through the Agent suggestion API.
- Before/after preview appears when a reference image and generated result are both available.
- Version-chain chips keep recent task lineage visible and make continued editing/Canvas handoff first-class.

### v1.3 Asset Library 2.0

- Gallery supports prompt/key/model search, tag/favorite filters, Collection filters, Collection creation, and Collection item membership.
- Asset detail lightbox shows metadata, actions, source asset, derivatives, tags, and generated lineage.
- Batch manifest and ZIP download endpoints export selected image assets.
- Gallery metadata update endpoint supports favorite/rating/tags/source linkage.
- Storage status is exposed in Ops with backend, configured state, migration recommendation, image totals, and orphan-task count.

### v1.4 team and operations

- Invite/session UX supports generated one-time links, roles, expiry, revocation, and workspace scoping.
- Audit logs can be filtered and exported as CSV.
- Ops dashboard now shows health/version, storage status, backup runbook status, provider health/quota notes, queue alerts, storage pressure, and failure-rate warnings.
- Destructive batch actions require explicit dangerous-action confirmation on the client.

### v1.5 creative Agent

- Agent API stores actionable suggestions for prompt variants, image next-step ideas, and Canvas next-node recommendations.
- Optional `AGENT_LLM_BASE_URL` / `AGENT_LLM_API_KEY` / `AGENT_LLM_MODEL` can power prompt variants through an OpenAI-compatible chat provider; otherwise local rules are used.
- Agent UI lets users generate suggestions, load prompt variants, apply a suggestion, or convert a suggestion into a generation task.
- Canvas can ask Agent for the next workflow node based on current graph context.

## Operating model

- Keep `STORAGE_BACKEND=local` on the single VPS deployment unless R2/S3/MinIO credentials are ready.
- Back up `STORAGE_DIR` regularly together with PostgreSQL; use `pnpm backup:rabisu` and restore-drill on a disposable target before major releases.
- Switch to `STORAGE_BACKEND=s3|r2|minio` when image volume or disk pressure justifies remote storage.
- Production should set stable `WORKBENCH_ADMIN_TOKEN` and `PROVIDER_SECRET_KEY`, then run `provider-secrets:migrate` once.
- Treat Canvas/Agent as the primary future differentiation surface; avoid returning to debug-first raw payload pages.
