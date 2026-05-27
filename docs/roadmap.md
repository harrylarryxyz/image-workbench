# Roadmap

## Completed in the v0.2 continuous implementation slice

- Provider validation returns structured 400 errors instead of generic server errors.
- Production API-base guard prevents stale browser chunks from calling `localhost:3100`.
- SSE task updates are available through `GET /tasks/:id/events`; web UIs fall back to polling when SSE is unavailable.
- Gallery 2.0 lists thumbnails/assets with filters, downloads, prompt reuse, task links, and reference-image reuse.
- Generated/gallery images can be reused as edit references.
- Edit workflow supports mask upload and a Konva-based mask editor.
- Prompt Library supports seed style templates, tag filtering, history-style reuse, and local prompt enhancement.
- React Flow Canvas supports Prompt/Image/Task nodes, reference edges, JSON import/export, and task creation from canvas prompt nodes.
- Storage keys now use a backend-prefixed contract for local and S3-compatible targets (`local://`, `s3://`, `r2://`, `minio://`).
- Provider secrets are encrypted at rest for new/updated records while legacy plaintext remains readable for migration compatibility.

## Next production-hardening candidates

- Attach a real S3 SDK adapter for remote object read/write in deployments that set `STORAGE_BACKEND=s3|r2|minio`.
- Add a one-shot database migration command that rewrites legacy plaintext provider keys to `enc:v1:*` values.
- Persist full Canvas projects through API/database routes instead of page-local JSON import/export.
- Generate and store real thumbnails for Gallery instead of falling back to the source asset when no `thumbnailKey` exists.
- Add E2E browser tests for Generate/Edit/Gallery/Canvas happy paths.
