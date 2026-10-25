#!/usr/bin/env bash
# Deliberate public launch step, after account/payment/filing and quota checks.
# DOMAIN=game.example.cn CERT_EMAIL=operator@example.cn ICP_CONFIRMED=true sudo -E bash scripts/deploy/publish.sh
set -euo pipefail
[[ $EUID -eq 0 && ${ICP_CONFIRMED:-false} == true ]] || { echo 'Root and confirmed filing/qualification are required.' >&2; exit 1; }
DOMAIN=${DOMAIN:?Set the filed domain}
CERT_EMAIL=${CERT_EMAIL:?Set certificate contact email}
[[ $DOMAIN =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ ]] || { echo 'Invalid domain.' >&2; exit 1; }
grep -qx 'PUBLIC_ACCESS_ENABLED=true' /etc/magical-athlete/server.env || { echo 'Review and enable public access in server.env first.' >&2; exit 1; }
grep -qx 'CONTROLLED_VALIDATION=false' /etc/magical-athlete/server.env || { echo 'Disable the controlled validation application gate before HTTPS publication.' >&2; exit 1; }
grep -qx 'DUAL_BACKEND_ENABLED=true' /etc/magical-athlete/server.env || { echo 'Dual-backend quota must be enabled first.' >&2; exit 1; }
# Admission is static, so the first public launch must verify the original
# server's reduced quota and grandfathered occupancy before opening this one.
SOURCE_DIR=$(cd -- "$(dirname -- "$0")/../.." && pwd)
bash "$SOURCE_DIR/scripts/deploy/check-dual-capacity.sh"
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
