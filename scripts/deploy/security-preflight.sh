#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run as root.' >&2; exit 1; }
SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
source "$SCRIPT_DIR/target-paths.sh"
DATABASE="$DEPLOY_DATA/security.sqlite"
CONFIG="/etc/$(basename "$DEPLOY_BASE")/security-ops.json"
ARGS=()
if [[ -f $DATABASE ]]; then
    ARGS+=(--health-url "http://127.0.0.1:$DEPLOY_PORT/api/security/health")
elif [[ -f $DEPLOY_BACKUPS/security-incremental/cursor.json ]]; then
    echo 'Required audit database is missing after initial use; publication blocked. Recover it first.' >&2
    exit 1
else
    # The first reviewed migration can initialize audit storage. New app startup
    # must fail closed if initialization fails. Later releases require readiness.
    ARGS+=(--allow-uninitialized)
    echo 'First audit migration: storage check only; application initialization/readiness must pass before reopening.' >&2
fi
if ! python3 "$SCRIPT_DIR/security-ops.py" preflight --database "$DATABASE" --config "$CONFIG" "${ARGS[@]}"; then
    logger -p daemon.err -t game-security 'New game release blocked: required audit/storage readiness failed.' || true
    exit 1
fi
