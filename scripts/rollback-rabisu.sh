#!/usr/bin/env bash
set -euo pipefail

: "${RABISU_SSH_PASSWORD:?set RABISU_SSH_PASSWORD}"
: "${ROLLBACK_RELEASE:?set ROLLBACK_RELEASE to a release directory basename under /opt/image-workbench/releases}"
HOST_ALIAS="${RABISU_HOST_ALIAS:-rabisu}"
SSH_CONFIG="${VPS_SSH_CONFIG:-/root/.vps-vault/ssh-config}"
BASE="${REMOTE_BASE_DIR:-/opt/image-workbench}"

export SSHPASS="$RABISU_SSH_PASSWORD"
sshpass -e ssh -o StrictHostKeyChecking=no -F "$SSH_CONFIG" "$HOST_ALIAS" bash -s -- "$BASE" "$ROLLBACK_RELEASE" <<'REMOTE'
set -euo pipefail
BASE="$1"
RELEASE="$2"
if [ "$RELEASE" != "$(basename "$RELEASE")" ] || [ -z "$RELEASE" ]; then
  echo "ROLLBACK_RELEASE must be a release directory basename" >&2
  exit 2
fi
TARGET="$BASE/releases/$RELEASE"
if [ ! -d "$TARGET" ]; then echo "release not found: $TARGET" >&2; exit 2; fi
PREVIOUS=""
if [ -L "$BASE/current" ]; then PREVIOUS="$(readlink -f "$BASE/current")"; fi
ln -sfn "$TARGET" "$BASE/current"
if ! systemctl restart image-workbench-api image-workbench-web; then
  [ -n "$PREVIOUS" ] && ln -sfn "$PREVIOUS" "$BASE/current" && systemctl restart image-workbench-api image-workbench-web || true
  exit 3
fi
if ! (curl -fsS "http://127.0.0.1:3100/health/live" >/dev/null && curl -fsS "http://127.0.0.1:3100/health/ready" >/dev/null && curl -fsS http://127.0.0.1:3000/ >/dev/null); then
  echo "rollback health check failed; restoring previous release" >&2
  [ -n "$PREVIOUS" ] && ln -sfn "$PREVIOUS" "$BASE/current" && systemctl restart image-workbench-api image-workbench-web || true
  exit 4
fi
printf 'rolled back to %s\n' "$TARGET"
REMOTE
