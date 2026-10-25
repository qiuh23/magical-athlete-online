#!/usr/bin/env bash
# Admission preflight only; never closes or migrates an existing room.
set -euo pipefail
CF_ORIGIN=${CLOUDFLARE_ORIGIN:-https://magical-athlete.qiuh23.workers.dev}
[[ $CF_ORIGIN =~ ^https://[A-Za-z0-9.-]+$ ]] || { echo 'Invalid Cloudflare origin.' >&2; exit 1; }
SOURCE_DIR=$(cd -- "$(dirname -- "$0")/../.." && pwd)
# Opt-in fallback when the mainland host cannot reach Cloudflare. The trusted
# management client captures the real response, then installs a fresh root-only
# snapshot over authenticated SSH; this is never an unchecked quota override.
if [[ -n ${CF_CAPACITY_FILE:-} ]]; then
    /opt/node/bin/node "$SOURCE_DIR/scripts/deploy/capacity.mjs" --snapshot "$CF_CAPACITY_FILE" "$CF_ORIGIN"
    exit 0
fi
CF_CAPACITY=$(curl --fail --silent --show-error --max-time 15 "$CF_ORIGIN/api/browser/rooms")
printf '%s' "$CF_CAPACITY" | /opt/node/bin/node "$SOURCE_DIR/scripts/deploy/capacity.mjs" --live
