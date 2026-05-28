# v0.8 Team Hardening Plan

## Goal

Turn the private single-user workbench into a safely shareable small-team deployment without breaking the existing bootstrap-token workflow.

## Delivered slices

1. Auth/session foundation
   - Public login endpoint for bootstrap/session tokens.
   - HTTP-only cookie support plus bearer-token compatibility.
   - Session token creation, listing, and revocation.

2. Role enforcement
   - Roles: owner, admin, operator, viewer.
   - Viewer read-only access.
   - Operator normal task/prompt/canvas operations.
   - Admin/owner provider, workspace, token, delete operations.

3. Workspace isolation
   - Provider, task, image, prompt, canvas, audit, ops queries scoped by workspace.
   - New generated tasks/assets inherit workspace context.
   - Uploaded reference assets are namespaced under the workspace upload prefix.

4. Audit hardening
   - Audit entries record workspace, token hash, actor label/role, IP, and user agent.

5. UI and docs
   - Settings page for current auth context, workspaces, and session-token management.
   - README, roadmap, changelog, and env examples updated.

## Verification

- API unit tests.
- API typecheck.
- Web typecheck/build.
- API-base production guard.
- Playwright smoke tests.
- Deployment smoke checks.
