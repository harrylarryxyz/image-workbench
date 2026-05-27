#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/backup-image-workbench.sh [options]

Creates a timestamped backup containing:
  - PostgreSQL dump from DATABASE_URL, if pg_dump is available
  - upload/storage directory archive
  - manifest with checksums and restore notes

Options:
  --app-dir DIR       App directory. Default: current directory
  --env-file FILE     Env file to load. Default: .env.local if present, then .env
  --output-dir DIR    Backup output directory. Default: ./backups
  --keep N            Keep latest N backup directories. Default: 14
  --dry-run           Print actions without creating backup
  -h, --help          Show help

Environment variables used:
  DATABASE_URL, STORAGE_DIR
EOF
}

APP_DIR="$(pwd)"
ENV_FILE=""
OUTPUT_DIR=""
KEEP="14"
DRY_RUN="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-dir) APP_DIR="$2"; shift 2 ;;
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --keep) KEEP="$2"; shift 2 ;;
    --dry-run) DRY_RUN="1"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if ! [[ "$KEEP" =~ ^[0-9]+$ ]] || [[ "$KEEP" -lt 1 ]]; then
  echo "--keep must be a positive integer" >&2
  exit 2
fi

APP_DIR="$(cd "$APP_DIR" && pwd)"
if [[ -z "$ENV_FILE" ]]; then
  if [[ -f "$APP_DIR/.env.local" ]]; then
    ENV_FILE="$APP_DIR/.env.local"
  elif [[ -f "$APP_DIR/.env" ]]; then
    ENV_FILE="$APP_DIR/.env"
  fi
fi
if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="$APP_DIR/backups"
fi
OUTPUT_DIR="$(mkdir -p "$OUTPUT_DIR" && cd "$OUTPUT_DIR" && pwd)"

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Env file not found: $ENV_FILE" >&2
    exit 2
  fi
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

TS="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$OUTPUT_DIR/$TS"
STORAGE_SOURCE="${STORAGE_DIR:-$APP_DIR/data/uploads}"
if [[ "$STORAGE_SOURCE" != /* ]]; then
  STORAGE_SOURCE="$APP_DIR/$STORAGE_SOURCE"
fi

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '[dry-run] %q ' "$@"
    printf '\n'
  else
    "$@"
  fi
}

write_manifest() {
  local manifest="$BACKUP_DIR/manifest.txt"
  {
    echo "image-workbench backup"
    echo "created_utc=$TS"
    echo "app_dir=$APP_DIR"
    echo "env_file=${ENV_FILE:-none}"
    echo "storage_source=$STORAGE_SOURCE"
    echo "database_dump=$([[ -f "$BACKUP_DIR/database.sql.gz" ]] && echo database.sql.gz || echo none)"
    echo "uploads_archive=$([[ -f "$BACKUP_DIR/uploads.tar.gz" ]] && echo uploads.tar.gz || echo none)"
    echo
    echo "sha256"
    find "$BACKUP_DIR" -maxdepth 1 -type f ! -name manifest.txt -print0 | sort -z | xargs -0r sha256sum
    echo
    echo "restore_notes"
    echo "- Stop API/Web before restoring mutable state."
    echo "- Restore database.sql.gz with psql only after explicit data-impact review."
    echo "- Restore uploads.tar.gz into STORAGE_DIR after taking a fresh pre-restore backup."
  } > "$manifest"
}

if [[ "$DRY_RUN" == "1" ]]; then
  echo "backup_dir=$BACKUP_DIR"
  echo "storage_source=$STORAGE_SOURCE"
  echo "database_url_present=$([[ -n "${DATABASE_URL:-}" ]] && echo yes || echo no)"
  exit 0
fi

mkdir -p "$BACKUP_DIR"

if [[ -n "${DATABASE_URL:-}" ]]; then
  if command -v pg_dump >/dev/null 2>&1; then
    pg_dump "$DATABASE_URL" | gzip -9 > "$BACKUP_DIR/database.sql.gz"
  else
    echo "WARN: pg_dump not found; skipping database dump" >&2
  fi
else
  echo "WARN: DATABASE_URL is empty; skipping database dump" >&2
fi

if [[ -d "$STORAGE_SOURCE" ]]; then
  tar -czf "$BACKUP_DIR/uploads.tar.gz" -C "$(dirname "$STORAGE_SOURCE")" "$(basename "$STORAGE_SOURCE")"
else
  echo "WARN: storage directory not found; skipping uploads archive: $STORAGE_SOURCE" >&2
fi

write_manifest

mapfile -t OLD_BACKUPS < <(find "$OUTPUT_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r | tail -n +$((KEEP + 1)))
for old in "${OLD_BACKUPS[@]}"; do
  run rm -rf "$OUTPUT_DIR/$old"
done

echo "backup_dir=$BACKUP_DIR"
echo "manifest=$BACKUP_DIR/manifest.txt"
