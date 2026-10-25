#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
source "$SCRIPT_DIR/target-paths.sh"
if [[ ${DEPLOY_LOCK_HELD:-false} != true ]]; then
    exec env DEPLOY_LOCK_HELD=true flock --wait 900 "/run/lock/magical-athlete-$DEPLOY_TARGET.deploy.lock" /bin/bash "$0" "$@"
fi
BASE=$DEPLOY_BASE
TARGET=$(readlink -f "$BASE/previous")
[[ $TARGET == "$BASE/releases/"* && -f $TARGET/.ready ]] || { echo 'No validated previous release.' >&2; exit 1; }
CURRENT=$(readlink -f "$BASE/current")
ln -sfn "$TARGET" "$BASE/current.next"
mv -Tf "$BASE/current.next" "$BASE/current"
systemctl restart "$DEPLOY_SERVICE"
curl --retry 5 --retry-connrefused --retry-delay 1 --fail "http://127.0.0.1:$DEPLOY_PORT/api/health"
ln -sfn "$CURRENT" "$BASE/previous"
echo "Restored code: $TARGET (live SQLite was preserved)."
