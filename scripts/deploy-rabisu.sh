#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/deploy-rabisu.sh [options]

Low-memory copy deployment for Rabisu. It builds/verifies locally, ships a git-archive source tarball plus build artifacts, extracts them into a symlinked release, preserves shared runtime state, restarts services, and runs loopback smoke checks.

Options:
  --host ALIAS             SSH alias. Default: rabisu
  --ssh-config FILE        SSH config. Default: /root/.vps-vault/ssh-config
  --credentials FILE       Credential env. Default: /root/.vps-vault/credentials.env
  --app-root DIR           Remote app root. Default: /opt/image-workbench
  --skip-local-verify      Skip local tests/build; use only existing artifacts
  --skip-restart           Upload/extract only; do not switch current or restart
  --keep-releases N        Keep latest N release directories after a successful restart. Default: 5
  -h, --help               Show help

The credentials file must define RABISU_SSH_PASSWORD for password SSH.
EOF
}

HOST="rabisu"
SSH_CONFIG="/root/.vps-vault/ssh-config"
CREDENTIALS="/root/.vps-vault/credentials.env"
APP_ROOT="/opt/image-workbench"
SKIP_LOCAL_VERIFY="0"
SKIP_RESTART="0"
KEEP_RELEASES="5"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --ssh-config) SSH_CONFIG="$2"; shift 2 ;;
    --credentials) CREDENTIALS="$2"; shift 2 ;;
    --app-root) APP_ROOT="$2"; shift 2 ;;
    --skip-local-verify) SKIP_LOCAL_VERIFY="1"; shift ;;
    --skip-restart) SKIP_RESTART="1"; shift ;;
    --keep-releases) KEEP_RELEASES="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [[ ! -f "$SSH_CONFIG" ]]; then
  echo "SSH config not found: $SSH_CONFIG" >&2
  exit 2
fi
if [[ ! -f "$CREDENTIALS" ]]; then
  echo "Credentials file not found: $CREDENTIALS" >&2
  exit 2
fi
set -a
# shellcheck disable=SC1090
. "$CREDENTIALS"
set +a
if [[ -z "${RABISU_SSH_PASSWORD:-}" ]]; then
  echo "RABISU_SSH_PASSWORD is not set in $CREDENTIALS" >&2
  exit 2
fi
export SSHPASS="$RABISU_SSH_PASSWORD"

if ! [[ "$KEEP_RELEASES" =~ ^[0-9]+$ ]] || [[ "$KEEP_RELEASES" -lt 1 ]]; then
  echo "--keep-releases must be a positive integer" >&2
  exit 2
fi

if [[ "$SKIP_LOCAL_VERIFY" != "1" ]]; then
  rm -rf apps/api/dist apps/web/test-results
  git checkout -- apps/web/next-env.d.ts 2>/dev/null || true
  pnpm --filter @image-workbench/api test
  pnpm --filter @image-workbench/api typecheck
  pnpm --filter @image-workbench/web typecheck
  pnpm --filter @image-workbench/web build
  pnpm --filter @image-workbench/web test -- api-base.production.test.js
  pnpm --filter @image-workbench/web test:e2e
  pnpm --filter @image-workbench/api build
fi

HEAD="$(git rev-parse --short=12 HEAD)"
TS="$(date -u +%Y%m%d-%H%M%S)"
SRC="/tmp/image-workbench-${HEAD}-${TS}.tar.gz"
ART="/tmp/image-workbench-artifacts-${HEAD}-${TS}.tar.gz"

git archive --format=tar.gz --output="$SRC" HEAD
tar -czf "$ART" apps/api/dist apps/web/.next apps/web/next-env.d.ts
sha256sum "$SRC" "$ART"

sshpass -e scp -o StrictHostKeyChecking=no -F "$SSH_CONFIG" "$SRC" "$ART" "$HOST:/tmp/"

REMOTE_SCRIPT=$(cat <<'EOS'
set -euo pipefail
HEAD="$1"
TS="$2"
APP_ROOT="$3"
SKIP_RESTART="$4"
KEEP_RELEASES="$5"
SRC="/tmp/image-workbench-${HEAD}-${TS}.tar.gz"
ART="/tmp/image-workbench-artifacts-${HEAD}-${TS}.tar.gz"
RELEASE="${APP_ROOT}/releases/${HEAD}-${TS}"
BACKUP="${APP_ROOT}/backups/pre-${HEAD}-${TS}"
mkdir -p "$RELEASE" "$BACKUP"
cp -a /etc/systemd/system/image-workbench-api.service /etc/systemd/system/image-workbench-web.service "$BACKUP"/
readlink -f "${APP_ROOT}/current" > "$BACKUP/current-target.txt" || true
systemctl is-active image-workbench-api > "$BACKUP/api-state.txt" || true
systemctl is-active image-workbench-web > "$BACKUP/web-state.txt" || true
sha256sum "$SRC" "$ART" > "$BACKUP/archive-sha256.txt"

tar -xzf "$SRC" -C "$RELEASE"
tar -xzf "$ART" -C "$RELEASE"
ln -sfn "${APP_ROOT}/shared/.env" "$RELEASE/.env.local"
ln -sfn "${APP_ROOT}/shared/uploads" "$RELEASE/data"
cd "$RELEASE"
/usr/local/bin/pnpm install --frozen-lockfile
/usr/local/bin/pnpm --filter @image-workbench/api prisma:generate
set -a
# shellcheck disable=SC1091
. "${APP_ROOT}/shared/.env"
set +a
(cd apps/api && /usr/local/bin/pnpm exec prisma migrate deploy)
/usr/local/bin/pnpm --filter @image-workbench/web test -- api-base.production.test.js

if [[ "$SKIP_RESTART" == "1" ]]; then
  echo "release=$RELEASE"
  echo "backup=$BACKUP"
  echo "restart=skipped"
  exit 0
fi

ln -sfn "$RELEASE" "${APP_ROOT}/current"
systemctl restart image-workbench-api image-workbench-web
sleep 5
systemctl is-active --quiet image-workbench-api
systemctl is-active --quiet image-workbench-web
AUTH_ARGS=()
if [[ -n "${WORKBENCH_ADMIN_TOKEN:-}" ]]; then
  AUTH_ARGS=(-H "Authorization: Bearer ${WORKBENCH_ADMIN_TOKEN}")
fi
API_JSON=$(curl -fsS "${AUTH_ARGS[@]}" http://127.0.0.1:3100/tasks/queue/status)
WEB_HTTP=$(curl -fsS -o /tmp/image-workbench-web-smoke.html -w '%{http_code}' http://127.0.0.1:3000/)
CURRENT_REAL=$(readlink -f "${APP_ROOT}/current")
mapfile -t OLD_RELEASES < <(find "${APP_ROOT}/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | awk '{print $2}' | grep -Fvx "$CURRENT_REAL" | tail -n +"$KEEP_RELEASES" || true)
if [[ "${#OLD_RELEASES[@]}" -gt 0 ]]; then
  printf '%s\n' "${OLD_RELEASES[@]}" | xargs -r rm -rf --
fi
echo "release=$RELEASE"
echo "backup=$BACKUP"
echo "api=$(systemctl is-active image-workbench-api)"
echo "web=$(systemctl is-active image-workbench-web)"
echo "web=$WEB_HTTP"
echo "api_json=${API_JSON:0:220}"
echo "pruned_releases=${#OLD_RELEASES[@]}"
journalctl -u image-workbench-api -u image-workbench-web --since '2 minutes ago' --no-pager -p warning..alert | tail -80
EOS
)

sshpass -e ssh -o StrictHostKeyChecking=no -F "$SSH_CONFIG" "$HOST" "bash -s" -- "$HEAD" "$TS" "$APP_ROOT" "$SKIP_RESTART" "$KEEP_RELEASES" <<<"$REMOTE_SCRIPT"

rm -rf apps/api/dist apps/web/test-results
git checkout -- apps/web/next-env.d.ts 2>/dev/null || true
