#!/usr/bin/env bash
# One-time root installation from a reviewed checkout. No cloud resources created.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run with sudo from a reviewed checkout.' >&2; exit 1; }
PUBLIC_IP=${PUBLIC_IP:?Set the instance public IPv4 address}
CLOUDFLARE_PREVIEW_ORIGIN=${CLOUDFLARE_PREVIEW_ORIGIN:?Set the isolated Cloudflare preview origin}
PREVIEW_PUBLIC_ACCESS_ENABLED=${PREVIEW_PUBLIC_ACCESS_ENABLED:-false}
[[ $PREVIEW_PUBLIC_ACCESS_ENABLED == true || $PREVIEW_PUBLIC_ACCESS_ENABLED == false ]] || { echo 'Invalid preview public-access flag.' >&2; exit 1; }
/opt/node/bin/node --input-type=module -e 'import {isIP} from "node:net"; if(isIP(process.argv[1])!==4||!/^https:\/\/[a-zA-Z0-9.-]+$/.test(process.argv[2]))throw Error("Require a public IPv4 and exact trusted HTTPS preview origin");' "$PUBLIC_IP" "$CLOUDFLARE_PREVIEW_ORIGIN"
SOURCE_DIR=$(cd -- "$(dirname -- "$0")/../.." && pwd)
PREVIEW_WILL_BE_PUBLIC=$PREVIEW_PUBLIC_ACCESS_ENABLED
if [[ -f /etc/magical-athlete-preview/server.env ]] && grep -Fqx 'PUBLIC_ACCESS_ENABLED=true' /etc/magical-athlete-preview/server.env; then PREVIEW_WILL_BE_PUBLIC=true; fi
if [[ -f /etc/magical-athlete-preview/server.env ]]; then
    for setting in 'HOST=127.0.0.1' 'PORT=3001' 'DATA_DIR=/var/lib/magical-athlete-preview' 'MULTIPLAYER_ROOM_LIMIT=1' 'DUAL_BACKEND_ENABLED=true'; do
        grep -Fqx "$setting" /etc/magical-athlete-preview/server.env || { echo 'Existing preview environment does not match the fixed isolated layout and quota.' >&2; exit 1; }
    done
fi
if [[ $PREVIEW_WILL_BE_PUBLIC == true ]]; then
    grep -Fqx 'SHARED_PREVIEW_ENABLED=true' /etc/magical-athlete/server.env || { echo 'Reserve the shared-preview slot in production configuration first.' >&2; exit 1; }
    grep -Fqx 'DUAL_BACKEND_ENABLED=true' /etc/magical-athlete/server.env || { echo 'Enable dual-backend admission first.' >&2; exit 1; }
    PRODUCTION_LIMIT=$(sed -n 's/^MULTIPLAYER_ROOM_LIMIT=//p' /etc/magical-athlete/server.env)
    [[ $PRODUCTION_LIMIT =~ ^([0-9]|1[0-4])$ ]] || { echo 'Set production quota <=14 before opening the isolated preview slot.' >&2; exit 1; }
    curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3000/api/rooms | /opt/node/bin/node "$SOURCE_DIR/scripts/deploy/capacity.mjs" --live 14
    CF_MAX_CAPACITY=14 bash "$SOURCE_DIR/scripts/deploy/check-dual-capacity.sh"
fi
LIB=/usr/local/lib/magical-athlete-deploy
id athlete >/dev/null 2>&1 || { echo 'Run bootstrap.sh first.' >&2; exit 1; }
for account in athlete-preview athlete-deploy athlete-preview-deploy; do
    id "$account" >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin "$account"
done
install -d -o root -g root -m 0755 "$LIB"
for file in ci-install.mjs unpack-ci-artifact.py extract-release.py target-paths.sh update.sh backup.sh rollback.sh; do
    install -o root -g root -m 0644 "$SOURCE_DIR/scripts/deploy/$file" "$LIB/$file"
done
install -o root -g root -m 0755 "$SOURCE_DIR/scripts/deploy/ci-install.sh" /usr/local/sbin/magical-athlete-ci-install
SUDOERS=$(mktemp)
trap 'rm -f -- "$SUDOERS"' EXIT
cat > "$SUDOERS" <<'POLICY'
Defaults:athlete-deploy env_reset, !setenv
Defaults:athlete-preview-deploy env_reset, !setenv
athlete-deploy ALL=(root) NOPASSWD: /usr/local/sbin/magical-athlete-ci-install *
athlete-preview-deploy ALL=(root) NOPASSWD: /usr/local/sbin/magical-athlete-ci-install *
POLICY
visudo --check --file "$SUDOERS"
install -o root -g root -m 0440 "$SUDOERS" /etc/sudoers.d/magical-athlete-deploy
install -d -o root -g athlete-preview -m 0750 /opt/magical-athlete-preview /opt/magical-athlete-preview/releases /etc/magical-athlete-preview
install -d -o athlete-preview -g athlete-preview -m 0750 /var/lib/magical-athlete-preview
install -d -o root -g root -m 0700 /var/backups/magical-athlete-preview
if [[ ! -f /etc/magical-athlete-preview/server.env ]]; then
    cat > /etc/magical-athlete-preview/server.env <<EOF
NODE_ENV=production
BACKEND_ID=aliyun
HOST=127.0.0.1
PORT=3001
DATA_DIR=/var/lib/magical-athlete-preview
TRUST_PROXY=1
DUAL_BACKEND_ENABLED=true
MULTIPLAYER_ROOM_LIMIT=1
PUBLIC_ACCESS_ENABLED=$PREVIEW_PUBLIC_ACCESS_ENABLED
CONTROLLED_VALIDATION=false
PUBLIC_ORIGIN=http://$PUBLIC_IP:8080
PUBLIC_ORIGINS=$CLOUDFLARE_PREVIEW_ORIGIN
BACKENDS_CONFIG_JSON='{"backends":[{"id":"cloudflare","origin":"$CLOUDFLARE_PREVIEW_ORIGIN","transport":"worker","enabled":true},{"id":"aliyun","origin":"","transport":"socketio","enabled":$PREVIEW_PUBLIC_ACCESS_ENABLED,"allowInsecureHttp":true}]}'
EOF
    chown root:athlete-preview /etc/magical-athlete-preview/server.env
    chmod 0640 /etc/magical-athlete-preview/server.env
fi
install -o root -g root -m 0644 "$SOURCE_DIR/deploy/magical-athlete-preview.service" /etc/systemd/system/magical-athlete-preview.service
export PUBLIC_IP
envsubst '${PUBLIC_IP}' < "$SOURCE_DIR/deploy/nginx-preview.conf.template" > /etc/nginx/sites-available/magical-athlete-preview
ln -sfn /etc/nginx/sites-available/magical-athlete-preview /etc/nginx/sites-enabled/magical-athlete-preview
nginx -t
cat > /usr/local/sbin/magical-athlete-backup <<'BACKUP'
#!/usr/bin/env bash
exec /bin/bash /usr/local/lib/magical-athlete-deploy/backup.sh
BACKUP
chmod 0750 /usr/local/sbin/magical-athlete-backup
cat > /etc/cron.daily/magical-athlete-backup <<'BACKUPS'
#!/usr/bin/env bash
set -euo pipefail
DEPLOY_TARGET=production /usr/local/sbin/magical-athlete-backup
DEPLOY_TARGET=preview /usr/local/sbin/magical-athlete-backup
BACKUPS
chmod 0750 /etc/cron.daily/magical-athlete-backup
systemctl daemon-reload
systemctl reload-or-restart nginx
echo 'CI installer and isolated preview service configured; no release started or security-group rule changed.'
echo 'Before enabling preview: reduce each production backend to 14 rooms, wait for occupancy <=14, then admit one preview room per backend.'
