#!/usr/bin/env bash
# Run only from the reviewed root-owned installed library.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run as root.' >&2; exit 1; }
SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
source "$SCRIPT_DIR/target-paths.sh"
ENV_FILE="/etc/$(basename "$DEPLOY_BASE")/server.env"
if [[ -f $ENV_FILE ]] && grep -Fqx 'SITE_EDITION=cn' "$ENV_FILE"; then
    echo 'Domestic access and communication auditing is disabled; historical private data is retained.'
    exit 0
fi
exec 9>"/run/lock/magical-athlete-$DEPLOY_TARGET.security.lock"
flock --wait 30 9
CONFIG="/etc/$(basename "$DEPLOY_BASE")/security-ops.json"
DATABASE="$DEPLOY_DATA/security.sqlite"
ARCHIVES="$DEPLOY_BACKUPS/security-incremental"
alarm() { logger -p daemon.err -t game-security 'Required security maintenance failed; check journal and storage. No retained data was removed to free space.' || true; }
trap alarm ERR
python3 "$SCRIPT_DIR/security-ops.py" preflight --database "$DATABASE" --config "$CONFIG"
python3 "$SCRIPT_DIR/security-ops.py" backup --database "$DATABASE" --archive-dir "$ARCHIVES"
python3 "$SCRIPT_DIR/security-ops.py" cleanup --database "$DATABASE" --archive-dir "$ARCHIVES"
# Rotation is configured separately; at most 20 expired closed files per run.
python3 "$SCRIPT_DIR/security-ops.py" cleanup-network
