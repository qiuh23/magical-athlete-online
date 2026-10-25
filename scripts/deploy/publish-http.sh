#!/usr/bin/env bash
# Temporary direct-IP HTTP entry. Controlled sources by default; explicit public opt-in.
# HTTP does not exempt a mainland website from ICP filing. Keep the filing open.
# sudo env PUBLIC_IP=203.0.113.1 ACCESS_CIDRS=198.51.100.2/32 HTTP_TRANSPORT_ACKNOWLEDGED=true bash scripts/deploy/publish-http.sh
set -euo pipefail
[[ $EUID -eq 0 && ${HTTP_TRANSPORT_ACKNOWLEDGED:-false} == true ]] || { echo 'Root and explicit plaintext HTTP acknowledgement are required.' >&2; exit 1; }
PUBLIC_IP=${PUBLIC_IP:?Set the instance public IPv4 address}
ACCESS_CIDRS=${ACCESS_CIDRS:?Set IPv4 /32 sources, or explicit 0.0.0.0/0 with PUBLIC_HTTP_ACCESS=true}
PUBLIC_HTTP_ACCESS=${PUBLIC_HTTP_ACCESS:-false}
[[ $PUBLIC_HTTP_ACCESS == true || $PUBLIC_HTTP_ACCESS == false ]] || { echo 'PUBLIC_HTTP_ACCESS must be true or false.' >&2; exit 1; }
SOURCE_DIR=$(cd -- "$(dirname -- "$0")/../.." && pwd)
valid_ipv4() {
    [[ $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || return 1
    local octet
    local -a octets
    IFS=. read -r -a octets <<< "$1"
    for octet in "${octets[@]}"; do
        [[ ${#octet} -le 3 && $((10#$octet)) -le 255 ]] || return 1
    done
}
valid_ipv4 "$PUBLIC_IP" || { echo 'Invalid public IPv4 address.' >&2; exit 1; }
HTTP_ACCESS_RULES=''
IFS=, read -r -a SOURCES <<< "$ACCESS_CIDRS"
for cidr in "${SOURCES[@]}"; do
    if [[ $cidr == 0.0.0.0/0 && $PUBLIC_HTTP_ACCESS == true ]]; then
        : # All IPv4 sources require the explicit public mode and application gate.
    else
        [[ $cidr == */32 ]] && valid_ipv4 "${cidr%/32}" || { echo 'Use IPv4 /32 sources; 0.0.0.0/0 additionally requires PUBLIC_HTTP_ACCESS=true.' >&2; exit 1; }
    fi
    HTTP_ACCESS_RULES+="    allow $cidr;"$'\n'
done
ENV_FILE=/etc/magical-athlete/server.env
if [[ $PUBLIC_HTTP_ACCESS == true ]]; then
    grep -Fqx 'PUBLIC_ACCESS_ENABLED=true' "$ENV_FILE" && grep -Fqx 'CONTROLLED_VALIDATION=false' "$ENV_FILE" || { echo 'Public HTTP requires PUBLIC_ACCESS_ENABLED=true and CONTROLLED_VALIDATION=false.' >&2; exit 1; }
else
    grep -Fqx 'PUBLIC_ACCESS_ENABLED=false' "$ENV_FILE" || { echo 'The public gate must remain disabled during controlled HTTP validation.' >&2; exit 1; }
    grep -Fqx 'CONTROLLED_VALIDATION=true' "$ENV_FILE" || { echo 'Enable the controlled validation application gate first.' >&2; exit 1; }
fi
grep -Fqx 'HOST=127.0.0.1' "$ENV_FILE" && grep -Fqx 'PORT=3000' "$ENV_FILE" || { echo 'The application must remain on loopback port 3000.' >&2; exit 1; }
grep -Fqx 'DUAL_BACKEND_ENABLED=true' "$ENV_FILE" && grep -Fqx 'MULTIPLAYER_ROOM_LIMIT=15' "$ENV_FILE" || { echo 'The Aliyun dual-backend quota must be 15.' >&2; exit 1; }
grep -Fqx "PUBLIC_ORIGIN=http://$PUBLIC_IP" "$ENV_FILE" || { echo 'PUBLIC_ORIGIN must exactly match the direct-IP HTTP entry.' >&2; exit 1; }
bash "$SOURCE_DIR/scripts/deploy/check-dual-capacity.sh"
export PUBLIC_IP HTTP_ACCESS_RULES
TARGET=/etc/nginx/sites-available/magical-athlete
BACKUP=''
if [[ -f $TARGET ]]; then BACKUP=$(mktemp /etc/nginx/sites-available/magical-athlete.before-http.XXXXXX); cp -p -- "$TARGET" "$BACKUP"; fi
envsubst '${PUBLIC_IP} ${HTTP_ACCESS_RULES}' < "$SOURCE_DIR/deploy/nginx-http.conf.template" > "$TARGET"
ln -sfn "$TARGET" /etc/nginx/sites-enabled/magical-athlete
if ! nginx -t; then
    if [[ -n $BACKUP ]]; then cp -p -- "$BACKUP" "$TARGET"; else rm -- /etc/nginx/sites-enabled/magical-athlete "$TARGET"; fi
    echo 'Invalid nginx configuration; the previous site file was restored.' >&2
    exit 1
fi
[[ ! -L /etc/nginx/sites-enabled/default ]] || unlink /etc/nginx/sites-enabled/default
systemctl enable nginx
systemctl restart magical-athlete
systemctl reload-or-restart nginx
for attempt in {1..20}; do
    if curl --fail --silent http://127.0.0.1:3000/api/connectivity; then break; fi
    if [[ $attempt == 20 ]]; then echo 'Application did not become healthy within 20 seconds.' >&2; exit 1; fi
    sleep 1
done
echo
if [[ $PUBLIC_HTTP_ACCESS == true ]]; then
    echo "Public HTTP entry configured: http://$PUBLIC_IP (sources: $ACCESS_CIDRS)."
    echo 'Apply the same source rules to security-group TCP 80; keep 3000 and public 443 closed.'
    echo 'Public HTTP is plaintext and does not waive ICP filing requirements; pending filing remains pending.'
else
    echo "Controlled HTTP entry configured: http://$PUBLIC_IP (approved source IPv4s only)."
    echo 'Open security-group TCP 80 only for the same /32 sources; keep 3000 and public 443 closed.'
fi
echo 'Verify from an allowed browser. HTTPS pages cannot directly connect to this HTTP backend.'
[[ -z $BACKUP ]] || echo "Previous nginx site file: $BACKUP"
