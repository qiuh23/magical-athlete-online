#!/usr/bin/env bash
# Mainland hosts no longer collect communication/access audits. Keep old records.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run as root from a reviewed checkout.' >&2; exit 1; }
SOURCE=$(cd -- "$(dirname -- "$0")/../.." && pwd)
LIB=/usr/local/lib/magical-athlete-deploy
install -d -o root -g root -m 0755 "$LIB"
for file in security-ops.py security-preflight.sh security-maintenance.sh target-paths.sh disable-cn-audit.sh; do
    install -o root -g root -m 0644 "$SOURCE/scripts/deploy/$file" "$LIB/$file"
done
bash "$LIB/disable-cn-audit.sh"
