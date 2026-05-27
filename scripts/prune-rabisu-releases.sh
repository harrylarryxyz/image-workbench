#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/prune-rabisu-releases.sh [options]

Prunes old /opt/image-workbench release directories while preserving the active release.

Options:
  --app-root DIR       Remote app root. Default: /opt/image-workbench
  --keep N             Number of newest inactive releases to keep. Default: 5
  --dry-run            Print releases that would be removed without deleting
  -h, --help           Show help
EOF
}

APP_ROOT="/opt/image-workbench"
KEEP="5"
DRY_RUN="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-root) APP_ROOT="$2"; shift 2 ;;
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

RELEASES_DIR="${APP_ROOT}/releases"
CURRENT_REAL="$(readlink -f "${APP_ROOT}/current" 2>/dev/null || true)"
if [[ -z "$CURRENT_REAL" || ! -d "$CURRENT_REAL" ]]; then
  echo "Could not resolve active release from ${APP_ROOT}/current" >&2
  exit 1
fi
if [[ ! -d "$RELEASES_DIR" ]]; then
  echo "Releases directory does not exist: $RELEASES_DIR" >&2
  exit 1
fi

mapfile -t OLD_RELEASES < <(
  find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
    | sort -rn \
    | awk '{print $2}' \
    | grep -Fvx "$CURRENT_REAL" \
    | tail -n +$((KEEP + 1)) \
    || true
)

if [[ "${#OLD_RELEASES[@]}" -eq 0 ]]; then
  echo "No releases to prune. active=$CURRENT_REAL keep=$KEEP"
  exit 0
fi

printf 'Pruning %s old release(s):\n' "${#OLD_RELEASES[@]}"
printf '  %s\n' "${OLD_RELEASES[@]}"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "dry-run=true"
  exit 0
fi

printf '%s\n' "${OLD_RELEASES[@]}" | xargs -r rm -rf --
echo "pruned=${#OLD_RELEASES[@]} active=$CURRENT_REAL keep=$KEEP"
