#!/usr/bin/env bash
# Admission preflight only; never closes or migrates an existing room.
set -euo pipefail
CF_ORIGIN=${CLOUDFLARE_ORIGIN:-https://magical-athlete.qiuh23.workers.dev}
[[ $CF_ORIGIN =~ ^https://[A-Za-z0-9.-]+$ ]] || { echo 'Invalid Cloudflare origin.' >&2; exit 1; }
CF_CAPACITY=$(curl --fail --silent --show-error --max-time 15 "$CF_ORIGIN/api/browser/rooms")
printf '%s' "$CF_CAPACITY" | /opt/node/bin/node --input-type=module -e '
let body=""; for await (const chunk of process.stdin) body+=chunk;
const capacity=JSON.parse(body).capacity;
if (!capacity || !Number.isInteger(capacity.limit) || capacity.limit<0 || capacity.limit>15 || !Number.isInteger(capacity.used) || capacity.used<0 || capacity.used>15) {
  throw Error("First reduce Cloudflare quota to 15 and wait for occupancy <=15; existing rooms must not be evicted.");
}'
