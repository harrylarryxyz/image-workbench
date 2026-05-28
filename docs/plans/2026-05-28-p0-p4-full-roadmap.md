# P0-P4 Full Roadmap Execution Plan

> **For Hermes:** Use continuous roadmap execution. Do not report per slice; commit verified slices and continue until final deploy.

**Goal:** Complete P0-P4 iterations for Image Workbench after v0.2, including reliability UX, Canvas workflow engine, multi-user/workspace isolation, usage/cost/quality ops, and real S3-compatible storage.

**Non-goals:** No external paid account creation. S3-compatible adapter is configurable and tested with mocked client; production remains local unless env is set.

## Slices

1. P0 reliability UX
   - Add task diagnostic package endpoint/action.
   - Add force-stop RUNNING, bulk retry failed, retry with parameter overrides.
   - Add gallery favorites/tags/rating and zip manifest download.
   - Add save successful task as prompt.

2. P1 Canvas engine
   - Add canvas snapshots/templates.
   - Add DAG runner with topological execution and upstream image references.
   - Persist node run state.

3. P2 multi-user/workspace
   - Add Workspace/UserSession tables with API-token derived user identity.
   - Attach workspace/user to providers/tasks/assets/prompts/canvas/audit where practical.
   - Default workspace remains backward-compatible for existing records.

4. P3 cost/quality/alerts
   - Add model cost config and task estimated cost.
   - Add image rating/feedback.
   - Add ops alerts for queue depth, failure rate, disk/storage pressure.

5. P4 S3-compatible adapter
   - Add @aws-sdk/client-s3.
   - Implement put/read/delete/presigned-style public URL support for s3/r2/minio.
   - Add local-to-remote migration dry-run script and orphan cleanup script.

## Gates

- `pnpm --filter @image-workbench/api prisma:generate`
- API tests/typecheck
- Web typecheck/build/API-base guard/E2E
- shell syntax + `git diff --check`
- commit, push, deploy to Rabisu, smoke API/Web/logs.
