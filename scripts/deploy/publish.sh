#!/usr/bin/env bash
# Deliberate public launch step, after account/payment/filing and quota checks.
# DOMAIN=game.example.cn CERT_EMAIL=operator@example.cn ICP_CONFIRMED=true sudo -E bash scripts/deploy/publish.sh
set -euo pipefail
[[ $EUID -eq 0 && ${ICP_CONFIRMED:-false} == true ]] || { echo 'Root and confirmed filing/qualification are required.' >&2; exit 1; }
DOMAIN=${DOMAIN:?Set the filed domain}
CERT_EMAIL=${CERT_EMAIL:?Set certificate contact email}
[[ $DOMAIN =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ ]] || { echo 'Invalid domain.' >&2; exit 1; }
grep -qx 'PUBLIC_ACCESS_ENABLED=true' /etc/magical-athlete/server.env || { echo 'Review and enable public access in server.env first.' >&2; exit 1; }
grep -qx 'DUAL_BACKEND_ENABLED=true' /etc/magical-athlete/server.env || { echo 'Dual-backend quota must be enabled first.' >&2; exit 1; }
# Admission is static, so the first public launch must verify the original
# server's reduced quota and grandfathered occupancy before opening this one.
CF_ORIGIN=${CLOUDFLARE_ORIGIN:-https://magical-athlete.qiuh23.workers.dev}
[[ $CF_ORIGIN =~ ^https://[A-Za-z0-9.-]+$ ]] || { echo 'Invalid Cloudflare origin.' >&2; exit 1; }
CF_CAPACITY=$(curl --fail --silent --show-error --max-time 15 "$CF_ORIGIN/api/browser/rooms")
printf '%s' "$CF_CAPACITY" | /opt/node/bin/node --input-type=module -e '
let body=""; for await (const chunk of process.stdin) body+=chunk;
const capacity=JSON.parse(body).capacity;
if (!capacity || !Number.isInteger(capacity.limit) || capacity.limit>15 || !Number.isInteger(capacity.used) || capacity.used>15) {
  throw Error("First reduce Cloudflare quota to 15 and wait for occupancy <=15; existing rooms must not be evicted.");
}'
SOURCE_DIR=$(cd -- "$(dirname -- "$0")/../.." && pwd)
export DOMAIN
envsubst '${DOMAIN}' < "$SOURCE_DIR/deploy/nginx.conf.template" > /etc/nginx/sites-available/magical-athlete
ln -sfn /etc/nginx/sites-available/magical-athlete /etc/nginx/sites-enabled/magical-athlete
[[ ! -L /etc/nginx/sites-enabled/default ]] || unlink /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl restart magical-athlete
certbot --nginx --non-interactive --agree-tos --email "$CERT_EMAIL" --redirect -d "$DOMAIN"
systemctl enable --now certbot.timer
curl --fail "https://$DOMAIN/api/connectivity"
echo 'Verify two independent browsers, realtime, assets and persistence before marking Aliyun enabled in both runtime registries.'
