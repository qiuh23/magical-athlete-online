#!/usr/bin/env bash
# Reviewed, explicit host migration. Does not restart apps or rewrite live vhosts.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run as root from a reviewed checkout.' >&2; exit 1; }
SOURCE=$(cd -- "$(dirname -- "$0")/../.." && pwd)
LIB=/usr/local/lib/magical-athlete-deploy
install -d -o root -g root -m 0755 "$LIB" /etc/nginx/conf.d
install -d -o root -g adm -m 0750 /var/log/game-network
for name in athlete-production athlete-preview; do
    path="/var/log/game-network/$name.log"
    if [[ ! -e $path ]]; then install -o www-data -g adm -m 0640 /dev/null "$path"; fi
done
for file in security-ops.py security-preflight.sh security-maintenance.sh target-paths.sh; do
    install -o root -g root -m 0644 "$SOURCE/scripts/deploy/$file" "$LIB/$file"
done
for pair in 'game-network-log.conf:/etc/nginx/conf.d/game-network-log.conf' 'game-network.logrotate:/etc/logrotate.d/game-network'; do
    name=${pair%%:*}; target=${pair#*:}
    if [[ -e $target ]] && ! cmp -s "$SOURCE/deploy/$name" "$target"; then
        echo "Existing shared logging policy differs: $target; review it before replacing." >&2; exit 1
    fi
    install -o root -g root -m 0644 "$SOURCE/deploy/$name" "$target"
done
for site in magical-athlete magical-athlete-preview; do
    [[ -d /etc/$site ]] || continue
    [[ -e /etc/$site/security-ops.json ]] || install -o root -g root -m 0644 "$SOURCE/deploy/security-ops.json.example" "/etc/$site/security-ops.json"
done
cat > /etc/cron.d/magical-athlete-security <<'CRON'
SHELL=/bin/bash
PATH=/opt/node/bin:/usr/sbin:/usr/bin:/sbin:/bin
7 * * * * root DEPLOY_TARGET=production bash /usr/local/lib/magical-athlete-deploy/security-maintenance.sh >/dev/null
11 * * * * root DEPLOY_TARGET=preview bash /usr/local/lib/magical-athlete-deploy/security-maintenance.sh >/dev/null
*/15 * * * * root DEPLOY_TARGET=production bash /usr/local/lib/magical-athlete-deploy/security-preflight.sh >/dev/null
*/15 * * * * root DEPLOY_TARGET=preview bash /usr/local/lib/magical-athlete-deploy/security-preflight.sh >/dev/null
CRON
chmod 0644 /etc/cron.d/magical-athlete-security
cat > /etc/cron.d/game-network-rotation <<'CRON'
SHELL=/bin/bash
PATH=/usr/sbin:/usr/bin:/sbin:/bin
*/15 * * * * root /usr/sbin/logrotate /etc/logrotate.d/game-network >/dev/null || logger -p daemon.err -t game-security 'Safe network log rotation failed; inspect storage and logrotate state.'
CRON
chmod 0644 /etc/cron.d/game-network-rotation
nginx -t
echo 'Security tools, shared safe log format, no-count-deletion rotation and cron installed.'
echo 'Review existing vhost logging directives before reload; no service was restarted.'
