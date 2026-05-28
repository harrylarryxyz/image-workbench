#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-${STORAGE_DIR:-./data/uploads}}"
if [[ ! -d "$ROOT" ]]; then
  echo "uploads_dir_missing=$ROOT"
  exit 0
fi
find "$ROOT" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' \) -printf '%s %p\n' | awk '{count+=1; bytes+=$1} END {printf "files=%d\nbytes=%d\n", count+0, bytes+0}'
