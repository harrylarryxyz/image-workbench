#!/usr/bin/env bash
set -euo pipefail

: "${RABISU_SSH_PASSWORD:?set RABISU_SSH_PASSWORD}"
: "${RESTORE_MANIFEST:?set RESTORE_MANIFEST to a remote manifest path}"
HOST_ALIAS="${RABISU_HOST_ALIAS:-rabisu}"
SSH_CONFIG="${VPS_SSH_CONFIG:-/root/.vps-vault/ssh-config}"
TARGET_DIR="${RESTORE_TARGET_DIR:-/opt/image-workbench/restore-drills/$(date -u +%Y%m%d-%H%M%S)}"

export SSHPASS="$RABISU_SSH_PASSWORD"
sshpass -e ssh -o StrictHostKeyChecking=no -F "$SSH_CONFIG" "$HOST_ALIAS" bash -s -- "$RESTORE_MANIFEST" "$TARGET_DIR" <<'REMOTE'
set -euo pipefail
MANIFEST="$1"
TARGET="$2"
mkdir -p "$TARGET"
python3 - "$MANIFEST" "$TARGET" <<'PY'
import gzip, hashlib, json, os, shutil, sys, tarfile
manifest_path, target = sys.argv[1:]
with open(manifest_path, encoding='utf-8') as f:
    manifest=json.load(f)
print(json.dumps({"manifest": manifest_path, "target": target, "files": manifest.get('files', [])}, indent=2))

def sha(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024), b''):
            h.update(chunk)
    return h.hexdigest()

def safe_members(tf, destination):
    dest=os.path.abspath(destination)
    for member in tf.getmembers():
        target_path=os.path.abspath(os.path.join(dest, member.name))
        if not (target_path == dest or target_path.startswith(dest + os.sep)):
            raise RuntimeError(f'unsafe tar member: {member.name}')
        yield member

for item in manifest.get('files', []):
    path=item['path']
    expected=item.get('sha256')
    if expected and sha(path) != expected:
        raise RuntimeError(f'checksum mismatch: {path}')
    name=os.path.basename(path)
    dest=os.path.join(target, name)
    shutil.copy2(path, dest)
    if name.endswith('.tar.gz'):
        outdir=os.path.join(target, 'uploads-extracted')
        os.makedirs(outdir, exist_ok=True)
        with tarfile.open(dest, 'r:gz') as tf:
            tf.extractall(outdir, members=safe_members(tf, outdir))
    if name.endswith('.sql.gz'):
        with gzip.open(dest, 'rb') as src, open(os.path.join(target, name[:-3]), 'wb') as out:
            shutil.copyfileobj(src, out)
print(json.dumps({"ok": True, "target": target, "manifest": manifest_path}, indent=2))
PY
REMOTE
