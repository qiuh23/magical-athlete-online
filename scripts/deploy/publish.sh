#!/usr/bin/env bash
# After merge only: add the reviewed game subdomain without replacing IP/preview sites.
# sudo env DOMAIN=athlete.magical-athlete-online.cn CERT_EMAIL=operator@example.cn ICP_CONFIRMED=true bash scripts/deploy/publish.sh
set -euo pipefail
[[ $EUID -eq 0 && ${ICP_CONFIRMED:-false} == true ]] || { echo 'Root and confirmed filing are required.' >&2; exit 1; }
export PATH=/opt/node/bin:$PATH
DOMAIN=${DOMAIN:?Set the reviewed game subdomain}
CERT_EMAIL=${CERT_EMAIL:?Set certificate contact email}
SOURCE_DIR=$(cd -- "$(dirname -- "$0")/../.." && pwd)
[[ -f /etc/nginx/conf.d/game-network-log.conf ]] || { echo 'Run the reviewed install-security.sh migration before changing game vhosts.' >&2; exit 1; }
bash "$SOURCE_DIR/scripts/deploy/security-preflight.sh"
ENV_FILE=/etc/magical-athlete/server.env
# Render/validate before any filesystem, service or certificate mutation.
CONFIG=$(node "$SOURCE_DIR/scripts/deploy/render-https.mjs" "$DOMAIN")
ACME_CONFIG=$(node "$SOURCE_DIR/scripts/deploy/render-https.mjs" "$DOMAIN" --acme-only)
exec 8>/run/lock/magical-athlete-production.deploy.lock
flock --wait 900 8
for value in 'PUBLIC_ACCESS_ENABLED=true' 'CONTROLLED_VALIDATION=false' 'DUAL_BACKEND_ENABLED=true' 'HOST=127.0.0.1' 'PORT=3000' "PUBLIC_ORIGIN=https://$DOMAIN"; do
    grep -Fqx "$value" "$ENV_FILE" || { echo 'Review the production env and preserve the exact legacy Origin before HTTPS publication.' >&2; exit 1; }
done
# Existing quota/capacity admission policy is unchanged.
QUOTA_MAX=15
if grep -Fqx 'SHARED_PREVIEW_ENABLED=true' "$ENV_FILE"; then QUOTA_MAX=14; fi
CF_MAX_CAPACITY=$QUOTA_MAX bash "$SOURCE_DIR/scripts/deploy/check-dual-capacity.sh"
exec 9>/run/lock/game-sites.configure.lock
flock --wait 120 9
TARGET=/etc/nginx/sites-available/magical-athlete-https
LINK=/etc/nginx/sites-enabled/magical-athlete-https
WORK=$(mktemp -d)
HAD_TARGET=false
HAD_LINK=false
[[ ! -L $TARGET ]] || { echo 'HTTPS target must be a regular site file.' >&2; exit 1; }
[[ ! -f $TARGET ]] || { cp -p -- "$TARGET" "$WORK/site"; HAD_TARGET=true; }
[[ ! -e $LINK && ! -L $LINK ]] || { [[ -L $LINK && $(readlink "$LINK") == "$TARGET" ]] || { echo 'Unexpected HTTPS site link; inspect it manually.' >&2; exit 1; }; HAD_LINK=true; }
SUCCESS=false
finish() {
    if [[ $SUCCESS != true ]]; then
        if [[ $HAD_TARGET == true ]]; then cp -p -- "$WORK/site" "$TARGET"; else rm -f -- "$TARGET"; fi
        if [[ $HAD_LINK != true ]]; then rm -f -- "$LINK"; fi
        if nginx -t; then systemctl reload nginx; fi
        echo 'The HTTPS site was restored; existing IP, preview, database and certificate files were retained.' >&2
    fi
    rm -rf -- "$WORK"
}
trap finish EXIT
install -d -m 0755 /var/lib/letsencrypt/.well-known/acme-challenge
if [[ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem && -f /etc/letsencrypt/live/$DOMAIN/privkey.pem ]]; then
    printf '%s\n' "$CONFIG" > "$TARGET"
else
    printf '%s\n' "$ACME_CONFIG" > "$TARGET"
fi
ln -sfn "$TARGET" "$LINK"
nginx -t
systemctl reload nginx
certbot certonly --webroot -w /var/lib/letsencrypt --cert-name "$DOMAIN" --non-interactive --agree-tos --email "$CERT_EMAIL" -d "$DOMAIN" --deploy-hook 'nginx -t && systemctl reload nginx'
printf '%s\n' "$CONFIG" > "$TARGET"
nginx -t
systemctl restart magical-athlete
systemctl reload nginx
systemctl enable --now certbot.timer
curl --fail --silent --show-error "https://$DOMAIN/api/connectivity"
SUCCESS=true
echo
echo 'HTTPS vhost installed. Keep legacy IP/port entries; complete two-browser/WSS, assets, refresh, expiry and certbot renew --dry-run checks before switching the reviewed entry registry and lobby.'
