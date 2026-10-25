#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
source "$SCRIPT_DIR/target-paths.sh"
DATABASE=$DEPLOY_DATA/rooms.sqlite
[[ -f $DATABASE ]] || exit 0
BACKUP_DIR=$DEPLOY_BACKUPS
install -d -m 0700 "$BACKUP_DIR"
BACKUP=$BACKUP_DIR/rooms-$(date -u +%Y%m%dT%H%M%S)-$$.sqlite
# SQLite online backup includes committed WAL state while the service runs.
sqlite3 "$DATABASE" ".backup '$BACKUP'"
[[ $(sqlite3 "$BACKUP" 'PRAGMA integrity_check;') == ok ]] || { echo 'Backup integrity failed.' >&2; exit 1; }
chmod 0600 "$BACKUP"
# Retention affects only this dedicated backup directory; off-instance copies
# are a separate operator action (never upload credentials with the database).
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'rooms-*.sqlite' -mtime +14 -delete
echo "$BACKUP"
