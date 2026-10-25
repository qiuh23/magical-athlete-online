#!/usr/bin/env bash
# Fixed deployment destinations. Never accept caller-supplied filesystem paths.
DEPLOY_TARGET=${DEPLOY_TARGET:-production}
case "$DEPLOY_TARGET" in
    production) DEPLOY_BASE=/opt/magical-athlete; DEPLOY_DATA=/var/lib/magical-athlete; DEPLOY_BACKUPS=/var/backups/magical-athlete; DEPLOY_SERVICE=magical-athlete; DEPLOY_GROUP=athlete; DEPLOY_PORT=3000 ;;
    preview) DEPLOY_BASE=/opt/magical-athlete-preview; DEPLOY_DATA=/var/lib/magical-athlete-preview; DEPLOY_BACKUPS=/var/backups/magical-athlete-preview; DEPLOY_SERVICE=magical-athlete-preview; DEPLOY_GROUP=athlete-preview; DEPLOY_PORT=3001 ;;
    *) echo 'DEPLOY_TARGET must be production or preview.' >&2; exit 1 ;;
esac
