# Image Workbench Continuous Roadmap Implementation Plan

> **For Hermes:** Execute continuously using TDD and subagent-driven-development where useful. Do not stop between tasks unless a task requires owner product/safety confirmation. Commit verified slices before moving to the next slice.

**Goal:** Complete the planned Image Workbench roadmap from production hardening through realtime tasks, richer gallery/edit workflows, prompt workflows, canvas workflows, storage abstraction, and provider secret encryption.

**Architecture:** Keep the existing TypeScript monorepo: Next.js web app, NestJS API, Prisma/PostgreSQL metadata, Redis/BullMQ task execution, local-first storage with pluggable backends. Each feature must be additive and preserve the deployed production contract at `image.yydes.ggff.net`.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Redis, BullMQ, Sharp, React Flow, Konva, pnpm/Turborepo.

---

## Operating Rules

- Work continuously through the roadmap; do not ask the owner to choose the next small task.
- Use TDD for production behavior changes: add failing tests/static guards first, then implement.
- After each independently scoped slice: run focused checks, `git diff --check`, commit, verify `git status`.
- Push after safe checkpoints if GitHub auth allows.
- Do not deploy/restart production unless the owner explicitly asks or the final task requires deployment confirmation.
- Never expose provider keys or VPS secrets in logs/docs.
- Preserve the `harrylarryxyz` repo identity.

## Roadmap Slices

### Slice 1: Provider/API error contract hardening

**Objective:** Provider and task endpoints return useful client errors instead of generic 500s for validation failures.

**Files:**
- Modify: `apps/api/src/providers/providers.service.ts`
- Modify: `apps/api/src/tasks/tasks.service.ts` if task validation has equivalent generic errors
- Modify: `apps/web/app/providers/page.tsx`
- Test: existing or new API tests under `apps/api/src/**/*.spec.ts`

**Acceptance:**
- Missing provider `name`, `baseUrl`, or `apiKey` returns HTTP 400 with explicit message.
- Provider UI displays the backend message.
- Upstream auth/quota/schema failures remain classified without leaking secrets.

### Slice 2: Production API-base/build guard

**Objective:** Prevent browser bundles from ever falling back to `http://localhost:3100` in production.

**Files:**
- Modify: `apps/web/lib/api.ts`
- Create/modify: script or test that inspects built `apps/web/.next/static` chunks
- Modify: `package.json` scripts if needed
- Docs: `docs/architecture.md` or deployment notes

**Acceptance:**
- Focused guard fails if `apps/web/.next/static` contains `http://localhost:3100`.
- Guard passes with browser default `/api`.
- README/deploy docs mention clean rebuild/sync of `.next` when deploying frontend source changes.

### Slice 3: SSE task events

**Objective:** Add server-sent events for realtime task updates and use it on Generate/Edit/Task Detail where practical.

**Files:**
- Modify/create: API task events service/controller under `apps/api/src/tasks/`
- Modify: worker/task service to publish status changes
- Modify: `apps/web/lib/api.ts` or new `apps/web/lib/task-events.ts`
- Modify: `apps/web/app/page.tsx`, `apps/web/app/edit/page.tsx`, `apps/web/app/tasks/[id]/page.tsx`

**Acceptance:**
- `GET /tasks/:id/events` streams task status updates and terminal payload.
- UI can fall back to polling if SSE errors.
- Tests cover stream format and terminal event.

### Slice 4: Gallery 2.0

**Objective:** Make gallery useful as a production workbench surface.

**Files:**
- Modify: `apps/api/src/gallery/*`
- Modify: `apps/api/src/storage/*` and image utils for thumbnails
- Modify: Prisma schema/migrations if thumbnail metadata is persisted
- Modify: `apps/web/app/gallery/page.tsx`

**Acceptance:**
- Gallery filters by type/status/model/date where data exists.
- Thumbnail URLs are available and safe.
- Cards support open task, download, reuse prompt, and use-as-reference.

### Slice 5: Reuse image as reference

**Objective:** Close the creative loop: generated/gallery images can be used directly as edit references.

**Files:**
- Modify: `apps/web/app/gallery/page.tsx`
- Modify: `apps/web/app/tasks/[id]/page.tsx`
- Modify: `apps/web/app/edit/page.tsx`
- Modify API if reference keys need validation/reuse helper

**Acceptance:**
- User can click “use as reference” from Gallery/Task Detail and land in Edit with refs preloaded.
- Edit task accepts existing stored asset keys without re-uploading.
- Tests cover invalid/missing ref key handling.

### Slice 6: Mask upload and Konva editor

**Objective:** Add mask editing workflow for image edits.

**Files:**
- Modify: `apps/api/src/storage/*` upload validation if mask type differs
- Modify: `apps/api/src/tasks/*` edit payload to accept mask key
- Modify: provider SDK edit request construction
- Modify/create: `apps/web/app/edit/*` mask editor components
- Dependency: Konva / react-konva if not present

**Acceptance:**
- User can upload or draw a mask for a reference image.
- Mask is sent to `/images/edits` where provider supports it.
- UI disables/labels mask path if current model/provider lacks support.

### Slice 7: Prompt workflows

**Objective:** Evolve prompt library into reusable style/workflow templates.

**Files:**
- Modify: `apps/api/src/prompts/*`
- Modify: Prisma prompt models if needed
- Modify: `apps/web/app/prompts/page.tsx`
- Modify: Generate/Edit pages to consume templates/history

**Acceptance:**
- Prompt presets support tags/style metadata.
- Prompt history captures successful generation/edit prompts.
- A simple enhancer/template application path exists without external LLM dependency unless configured.

### Slice 8: React Flow canvas workflows

**Objective:** Implement the Phase 5 node-based workbench.

**Files:**
- Modify/create: `apps/api/src/canvas/*`
- Modify Prisma canvas project/node/edge models if needed
- Replace: `apps/web/app/canvas/page.tsx`
- Dependency: React Flow if not present

**Acceptance:**
- User can create/load a canvas project.
- Canvas supports Prompt/Image/Task nodes and reference edges.
- Canvas can create a generation/edit task from connected nodes.
- Export/import JSON works.

### Slice 9: S3/R2/MinIO storage backend

**Objective:** Preserve local storage while adding S3-compatible backend option.

**Files:**
- Modify: `apps/api/src/storage/*`
- Modify: `.env.example`, README
- Add dependency if needed for S3 client

**Acceptance:**
- Storage backend selected by env.
- Local behavior remains default and tested.
- S3-compatible put/get signed-or-proxied serving works without exposing credentials.

### Slice 10: Provider secret encryption

**Objective:** Stop storing provider keys as plaintext in `apiKeyEncrypted`.

**Files:**
- Modify: Prisma schema/migration if needed
- Modify: `apps/api/src/providers/providers.service.ts`
- Add encryption utility with env-managed key
- Update `.env.example`, README

**Acceptance:**
- New provider keys are encrypted at rest.
- Existing plaintext rows are migrated or lazily upgraded safely.
- List/test/generate behavior still works.
- Tests assert raw fake key is not persisted or returned.

### Slice 11: Documentation and final verification

**Objective:** Make the completed structure discoverable and verified.

**Files:**
- Update: `README.md`
- Update: `CHANGELOG.md`
- Update: `docs/roadmap.md`
- Add/update: architecture docs and operation notes

**Acceptance:**
- README status matches implemented features.
- Roadmap distinguishes completed vs future work.
- `pnpm typecheck`, `pnpm test`, `pnpm build`, and `git diff --check` pass.
- Commit and push verified.
