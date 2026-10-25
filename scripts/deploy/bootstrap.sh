#!/usr/bin/env bash
# Ubuntu 24.04 / Debian 12+, run as root. No cloud resource is purchased.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
SOURCE_DIR=$(cd -- "$(dirname -- "$0")/../.." && pwd)
apt-get update
apt-get install -y ca-certificates curl git xz-utils sqlite3 nginx certbot python3-certbot-nginx gettext-base
# The server is initially private; no nginx listener or firewall rule is opened.
if [[ ! -f /etc/magical-athlete/server.env ]]; then systemctl stop nginx; fi
case "$(uname -m)" in x86_64) ARCH=x64;; aarch64) ARCH=arm64;; *) echo 'Unsupported architecture.' >&2; exit 1;; esac
if [[ ! -x /opt/node/bin/node ]] || [[ $(/opt/node/bin/node -p 'process.versions.node.split(".")[0]') != 24 ]]; then
    WORK=$(mktemp -d)
    trap 'rm -rf -- "$WORK"' EXIT
    if [[ -n ${NODE_DOWNLOAD_DIR:-} ]]; then
        cp -- "$NODE_DOWNLOAD_DIR/SHASUMS256.txt" "$WORK/SHASUMS256.txt"
    else
        curl --fail --location --connect-timeout 15 --max-time 60 --retry 2 https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt -o "$WORK/SHASUMS256.txt" || { echo 'Official Node download unavailable. Upload its archive and SHASUMS256.txt, then rerun with NODE_DOWNLOAD_DIR.' >&2; exit 1; }
    fi
    NODE_ARCHIVE=$(awk -v arch="$ARCH" '$2 ~ "^node-v24\\.[0-9]+\\.[0-9]+-linux-"arch"\\.tar\\.xz$" {print $2}' "$WORK/SHASUMS256.txt")
    [[ -n $NODE_ARCHIVE && $NODE_ARCHIVE != *$'\n'* ]] || { echo 'Unable to resolve a single official Node 24 release.' >&2; exit 1; }
    if [[ -n ${NODE_DOWNLOAD_DIR:-} ]]; then
        cp -- "$NODE_DOWNLOAD_DIR/$NODE_ARCHIVE" "$WORK/$NODE_ARCHIVE"
    else
        curl --fail --location --connect-timeout 15 --max-time 600 --retry 2 "https://nodejs.org/dist/latest-v24.x/$NODE_ARCHIVE" -o "$WORK/$NODE_ARCHIVE"
    fi
    (cd "$WORK" && awk -v name="$NODE_ARCHIVE" '$2==name' SHASUMS256.txt | sha256sum --check -)
    mkdir -p /opt/node
    tar -xJf "$WORK/$NODE_ARCHIVE" --strip-components=1 -C /opt/node
fi
export PATH=/opt/node/bin:$PATH
if ! command -v pnpm >/dev/null || [[ $(pnpm --version) != 11.25.0 ]]; then npm install --global pnpm@11.25.0; fi
id athlete >/dev/null 2>&1 || useradd --system --home /opt/magical-athlete --shell /usr/sbin/nologin athlete
install -d -o root -g athlete -m 0750 /opt/magical-athlete /opt/magical-athlete/releases /etc/magical-athlete
install -d -o athlete -g athlete -m 0750 /var/lib/magical-athlete
install -d -o root -g root -m 0700 /var/backups/magical-athlete
if [[ ! -f /etc/magical-athlete/server.env ]]; then install -o root -g athlete -m 0640 "$SOURCE_DIR/deploy/aliyun.env.example" /etc/magical-athlete/server.env; fi
install -m 0644 "$SOURCE_DIR/deploy/magical-athlete.service" /etc/systemd/system/magical-athlete.service
install -m 0750 "$SOURCE_DIR/scripts/deploy/backup.sh" /usr/local/sbin/magical-athlete-backup
printf '%s\n' '#!/bin/sh' 'exec /usr/local/sbin/magical-athlete-backup' > /etc/cron.daily/magical-athlete-backup
chmod 0750 /etc/cron.daily/magical-athlete-backup
systemctl daemon-reload
echo 'Private initialization complete. Review /etc/magical-athlete/server.env; deploy a release next.'
echo 'Cloud security group: allow SSH from your own IP only. Keep 80/443/3000 closed until approved.'
