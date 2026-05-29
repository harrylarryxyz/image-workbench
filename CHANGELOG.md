# Changelog

All notable changes to Image Workbench are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Route-isolated `/visual-directions` art-direction board with six divergent polished styles — Lunar Precision, Cinema Studio, Atelier Gallery, Creative Board, Velvet Suite, and Warm Craft — so visual taste can be selected before committing to a single design-system theme.
- Route-isolated `/visual-stage` Visual Master first surface with Creation Case, Reference-first / Generate-first / Ask-first routing language, Champion + Comparison Set, reference territories, and static product-contract guardrails.
- Deterministic `/visual-stage` Creation Case router for sparse avatar, clear poster, and hard-blocker likeness prompts, with judgment-first feedback, mobile-visible comparison, and local mock delivery package flow.
- Visual Stage product-philosophy PRD, accepted ADR, PC/mobile interaction/visual spec, discovery log, and first-slice implementation plan for the unified Creation Case routing model.
- Create Studio visual-master ADR, implementation plan, and reusable UI rules document for future Gallery and Canvas migration slices.
- Product-level studio primitives that compose Tailwind/Shadcn surfaces for hero, composer panel, preview stage, compare frame, metrics, action toolbar, and support grid.

### Changed

- Create Studio now renders through shared product primitives instead of page-specific `lovart-*`/Create-only global CSS classes, with scoped contract tests preventing regressions.

### Fixed

- Mobile navigation now uses a top-left collapsed menu with the full route set instead of a fixed bottom bar whose `More` shortcut jumped straight to Settings and covered operation-heavy pages.
- Canvas workflow actions now live outside the React Flow surface, preventing the node toolbar from covering the canvas preview, minimap, and zoom controls on phones.
- Root App Router layout imports `globals.css` again, restoring compiled styles on every production Web route and preventing unstyled/misaligned pages after the responsive studio shell refactor.
- Hidden reference upload inputs and mobile Canvas panels no longer widen the document, preventing desktop and phone layouts from gaining accidental horizontal scroll.
- UI contract tests now guard the required root stylesheet import plus responsive overflow protections so future shell refactors cannot silently ship pages without global CSS or mobile-safe shrink constraints.
- Edit masks are resized to the first reference image dimensions before provider upload, preventing `Invalid mask image format - mask size does not match image size` failures from display-sized mask canvases.
- Browser-painted edit masks now keep the preview canvas aligned with the reference image and convert painted regions to provider-transparent edit regions, so edits apply to the brushed area instead of the inverse area.

## [0.2.0] - 2026-05-28

### Added

- Production readiness endpoints: `/health/live`, `/health/ready`, and `/health/version`.
- Redacted readiness checks for database, Redis, storage, admin-token mode, and provider-secret migration state.
- GitHub Actions quality workflow template (`docs/ci/quality.yml`) with Postgres, Redis, Prisma validation/generation, API tests/typecheck, Web typecheck/tests, Playwright smoke, production build, API-base guard, and shell syntax checks. Install it under `.github/workflows/quality.yml` with a token that has `workflow` scope.
- Rabisu operations helpers:
  - `pnpm backup:rabisu`
  - `pnpm restore:rabisu`
  - `pnpm rollback:rabisu`
- Backup manifest with SHA-256 checksums and restore-drill checksum verification.
- Symlink-based rollback with release-basename validation and automatic previous-release restoration on failed health checks.
- Canvas professional workflow API and UI:
  - project CRUD
  - template-to-project
  - run records
  - node execution state
  - terminal task reconciliation
  - rerun node
  - replay run
  - live result thumbnails
- Create Studio 2.0:
  - unified generate/edit flow
  - prompt variants
  - reference image keys
  - `@image(...)` reference extraction
  - mask support
  - before/after comparison framing
  - version/source lineage support
- Asset Library 2.0:
  - gallery search/filtering
  - image detail/lightbox view
  - collections
  - tags, favorites, ratings
  - source/derivative lineage
  - manifest and ZIP batch download
  - storage status and local-to-remote migration status endpoint
- S3/R2/MinIO-compatible storage adapter while keeping local storage compatibility.
- Workspace-scoped gallery lineage validation to prevent cross-workspace source asset leaks.
- Provider secret encryption support and provider-secret migration tests.
- Team/ops UX:
  - invite/session token actions
  - cookie login helper
  - audit filtering/export
  - provider health/quota signals
  - queue/storage alerts
  - danger-zone confirmations
- Creative Agent API and UI:
  - prompt variants
  - provider-optional prompt enhancer with local fallback
  - Canvas next-step suggestions
  - suggestion-to-task workflow
- Prompt Library enhancements: tag filtering, style templates, history, and local enhancer.
- Browser mask editor with Konva.
- Task SSE endpoint and frontend SSE-first/fallback-polling integration.
- Production API-base regression guard for Web browser chunks.

### Changed

- Rabisu deploy flow now validates `/health/live`, `/health/ready`, `/health/version`, API smoke, Web smoke, and production API-base safety before completing.
- Gallery and asset download APIs now use workspace-scoped access checks for linked assets, uploads, thumbnails, and remote object keys.
- Canvas metadata-only updates no longer delete graph nodes or edges.
- `/health/ready` no longer exposes filesystem paths, bucket names, raw error messages, or provider-secret fingerprints.
- README, roadmap, architecture, and operations documentation now describe the completed v10-v15 implementation and production runbooks.

### Fixed

- Provider validation now returns structured bad-request responses for missing required fields.
- Stale production Web builds are guarded against browser-side `localhost:3100` regressions.
- Canvas run records reconcile with async task completion instead of staying permanently `RUNNING`.
- Remote-storage uploaded assets normalize backend-prefixed keys before workspace upload authorization.
- Restore drills reject unsafe tar members and fail on checksum mismatch.

## [0.1.0] - 2026-05-27

### Added

- Initial monorepo structure with NestJS API, Next.js Web app, shared schemas, and provider adapters.
- Image generation and edit task creation backed by Bull/Redis and Prisma.
- Provider configuration management and basic provider validation.
- Local image asset persistence, gallery listing, and task image metadata.
- Prompt presets and initial canvas/project surfaces.
- Basic API/Web smoke tests and development Docker Compose infrastructure.
