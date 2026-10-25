#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 && $# == 1 ]] || { echo 'Use the constrained sudo deployment entrypoint with one encoded request.' >&2; exit 1; }
# sudo supplies SUDO_USER; the root-owned Node validator binds it to one target.
exec env -i PATH=/opt/node/bin:/usr/sbin:/usr/bin:/sbin:/bin HOME=/root SUDO_USER="${SUDO_USER:-}" /opt/node/bin/node /usr/local/lib/magical-athlete-deploy/ci-install.mjs "$1"
