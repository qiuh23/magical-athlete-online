#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
BASE=/opt/magical-athlete
TARGET=$(readlink -f "$BASE/previous")
[[ $TARGET == "$BASE/releases/"* && -f $TARGET/.ready ]] || { echo 'No validated previous release.' >&2; exit 1; }
CURRENT=$(readlink -f "$BASE/current")
ln -sfn "$TARGET" "$BASE/current.next"
mv -Tf "$BASE/current.next" "$BASE/current"
systemctl restart magical-athlete
curl --retry 5 --retry-connrefused --retry-delay 1 --fail http://127.0.0.1:3000/api/health
ln -sfn "$CURRENT" "$BASE/previous"
echo "Restored code: $TARGET (live SQLite was preserved)."
