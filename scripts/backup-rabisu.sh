#!/usr/bin/env bash
set -euo pipefail

: "${RABISU_SSH_PASSWORD:?set RABISU_SSH_PASSWORD}"
HOST_ALIAS="${RABISU_HOST_ALIAS:-rabisu}"
SSH_CONFIG="${VPS_SSH_CONFIG:-/root/.vps-vault/ssh-config}"
REMOTE_APP="${REMOTE_APP_DIR:-/opt/image-workbench/current}"
REMOTE_SHARED="${REMOTE_SHARED_DIR:-/opt/image-workbench/shared}"
REMOTE_BACKUP_DIR="${REMOTE_BACKUP_DIR:-/opt/image-workbench/backups/data}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"

export SSHPASS="$RABISU_SSH_PASSWORD"
sshpass -e ssh -o StrictHostKeyChecking=no -F "$SSH_CONFIG" "$HOST_ALIAS" bash -s -- "$REMOTE_APP" "$REMOTE_SHARED" "$REMOTE_BACKUP_DIR" "$STAMP" <<'REMOTE'
set -euo pipefail
APP="$1"
SHARED="$2"
BACKUPS="$3"
STAMP="$4"
mkdir -p "$BACKUPS"
MANIFEST="$BACKUPS/backup-$STAMP-manifest.json"
DB_ARCHIVE="$BACKUPS/db-$STAMP.sql.gz"
DATA_ARCHIVE="$BACKUPS/uploads-$STAMP.tar.gz"

for env_file in "$SHARED/.env" "$APP/.env.local" "$APP/.env"; do
  if [ -f "$env_file" ]; then set -a; . "$env_file"; set +a; fi
done

FILES=()
if command -v pg_dump >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" | gzip -9 > "$DB_ARCHIVE"
  FILES+=("$DB_ARCHIVE")
else
  printf 'warning: pg_dump unavailable or DATABASE_URL missing; database backup skipped\n' >&2
fi

UPLOADS_DIR=""
for candidate in "$SHARED/uploads" "/opt/image-workbench/uploads"; do
  if [ -d "$candidate" ]; then UPLOADS_DIR="$candidate"; break; fi
done
if [ -n "$UPLOADS_DIR" ]; then
  tar -C "$(dirname "$UPLOADS_DIR")" -czf "$DATA_ARCHIVE" "$(basename "$UPLOADS_DIR")"
  FILES+=("$DATA_ARCHIVE")
else
  printf 'warning: uploads directory missing; asset backup skipped\n' >&2
fi

if [ "${#FILES[@]}" -eq 0 ]; then
  printf 'backup aborted: no database or uploads archive was created\n' >&2
  exit 3
fi

python3 - "$MANIFEST" "$STAMP" "${FILES[@]}" <<'PY'
import hashlib, json, os, sys, time
manifest, stamp, *files = sys.argv[1:]
def sha(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024), b''):
            h.update(chunk)
    return h.hexdigest()
payload={
    "createdAt": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    "stamp": stamp,
    "files": [{"path": p, "bytes": os.path.getsize(p), "sha256": sha(p)} for p in files],
}
with open(manifest, 'w', encoding='utf-8') as f:
    json.dump(payload, f, indent=2)
    f.write('\n')
print(json.dumps(payload, indent=2))
PY
ln -sfn "$MANIFEST" "$(dirname "$MANIFEST")/latest-manifest.json"
REMOTE
