# Non-S3 Completion Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Complete the remaining image-workbench maturity features except the explicitly deferred S3/R2/MinIO adapter.

**Architecture:** Add lightweight internal auth/audit, provider capability contracts, safer queue operations, gallery batch actions, prompt history/version helpers, executable canvas runner, and operational metrics/scripts. Keep changes local-compatible and avoid paid/external services.

**Tech Stack:** NestJS, Prisma/PostgreSQL, BullMQ, Next.js App Router, React Flow, pnpm.

## Non-goal
- Real S3/R2/MinIO object storage adapter remains deferred. Existing storage key contract stays intact.

## Slices
1. Auth/audit: optional `WORKBENCH_ADMIN_TOKEN`, audit log table/listing, non-breaking default when token absent.
2. Provider capabilities: stricter backend validation and frontend parameter guidance.
3. Queue reliability: retry/backoff, stale timeout, dead-letter/failed listing, manual cancel/retry.
4. Gallery batch: batch delete and UI multi-select actions.
5. Prompt Library 2.0: history from tasks, prompt versioning, variable rendering.
6. Canvas runner: execute task nodes from connected prompt/image nodes, persist task ids to graph.
7. Metrics/ops: usage metrics endpoint, restore/orphan cleanup scripts, docs.
8. Final gates: API/web tests, typecheck, build, E2E, docs/changelog, push, deploy, smoke.
