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

## Deferred until resources exist

- Attach a real S3 SDK adapter for remote object read/write in deployments that set `STORAGE_BACKEND=s3|r2|minio`.

## Suggested near-term operating model

- Keep `STORAGE_BACKEND=local` on the single VPS deployment.
- Back up `STORAGE_DIR` regularly together with PostgreSQL.
- Use the S3/R2/MinIO key contract as a future migration seam, not a current dependency.
