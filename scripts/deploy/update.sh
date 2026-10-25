#!/usr/bin/env bash
# Run on the instance, from a reviewed checkout at the requested commit.
# Usage: sudo bash scripts/deploy/update.sh <full-commit-sha> [Linux-production-bundle.tar.gz]
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
export PATH=/opt/node/bin:$PATH
SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
source "$SCRIPT_DIR/target-paths.sh"
if [[ ${DEPLOY_LOCK_HELD:-false} != true ]]; then
    exec env DEPLOY_LOCK_HELD=true flock --wait 900 "/run/lock/magical-athlete-$DEPLOY_TARGET.deploy.lock" /bin/bash "$0" "$@"
fi
COMMIT=${1:?Pass a full reviewed commit SHA}
[[ $COMMIT =~ ^[0-9a-f]{40}$ ]] || { echo 'A full commit SHA is required.' >&2; exit 1; }
BUNDLE=${2:-}
if [[ -n $BUNDLE ]]; then
    BUNDLE=$(realpath -- "$BUNDLE")
    [[ -f $BUNDLE && -f $BUNDLE.sha256 ]] || { echo 'Bundle and its trusted CI SHA256 sidecar are required.' >&2; exit 1; }
    (cd "$(dirname -- "$BUNDLE")" && sha256sum --check "$(basename -- "$BUNDLE").sha256")
    tar -tzf "$BUNDLE" | awk '/^\// || /(^|\/)\.\.($|\/)/ {bad=1} END {exit bad}' || { echo 'Unsafe archive path.' >&2; exit 1; }
else
    [[ $(git rev-parse HEAD) == "$COMMIT" && -z $(git status --porcelain --untracked-files=no) ]] || { echo 'Checkout must be clean and match the requested commit.' >&2; exit 1; }
fi
BASE=$DEPLOY_BASE
# A checked build is identified by both its source and workflow run. Reusing
# a same-commit directory would retain an older run's deployment.json/.ready.
# Manual source deployments keep their existing forty-character directory.
RELEASE_NAME=$(node --input-type=module - "$SCRIPT_DIR/ci-install.mjs" "$COMMIT" "${DEPLOY_BUILD_ID:-}" <<'NODE'
import {pathToFileURL} from 'node:url';
const {releaseName}=await import(pathToFileURL(process.argv[2]).href);
console.log(releaseName(process.argv[3],process.argv[4]));
NODE
)
RELEASE=$BASE/releases/$RELEASE_NAME
if [[ ! -f $RELEASE/.ready ]]; then
    [[ ! -e $RELEASE ]] || { echo 'Incomplete release already exists; inspect it before retrying.' >&2; exit 1; }
    install -d -m 0750 -o root -g "$DEPLOY_GROUP" "$RELEASE"
    if [[ -n $BUNDLE ]]; then
        python3 "$SCRIPT_DIR/extract-release.py" "$BUNDLE" "$RELEASE"
        node --input-type=module -e 'import fs from "node:fs"; if(fs.statSync(process.argv[1]).size>65536)throw Error("Release manifest is oversized"); const release=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if(release.commit!==process.argv[2] || release.platform!==process.platform || release.arch!==process.arch || release.nodeMajor!==24 || Number(process.versions.node.split(".")[0])!==24)throw Error("Bundle commit/platform/architecture/Node version mismatch");' "$RELEASE/release.json" "$COMMIT"
        [[ -f $RELEASE/dist/client/index.html && -f $RELEASE/dist/server/server/index.js ]] || { echo 'Bundle is incomplete.' >&2; exit 1; }
    else
        git archive "$COMMIT" | tar -x -C "$RELEASE"
        (cd "$RELEASE" && pnpm install --frozen-lockfile && pnpm typecheck && pnpm build)
    fi
    touch "$RELEASE/.ready"
    chown -R "root:$DEPLOY_GROUP" "$RELEASE"
    chmod -R g+rX,o-rwx "$RELEASE"
fi
[[ ! -f $DEPLOY_DATA/rooms.sqlite ]] || DEPLOY_TARGET="$DEPLOY_TARGET" bash "$SCRIPT_DIR/backup.sh"
PREVIOUS=$(readlink -f "$BASE/current" || true)
if [[ -n $PREVIOUS && $PREVIOUS != "$RELEASE" ]]; then ln -sfn "$PREVIOUS" "$BASE/previous"; fi
ln -sfn "$RELEASE" "$BASE/current.next"
mv -Tf "$BASE/current.next" "$BASE/current"
systemctl enable "$DEPLOY_SERVICE"
systemctl restart "$DEPLOY_SERVICE"
for attempt in {1..20}; do
    if curl --fail --silent "http://127.0.0.1:$DEPLOY_PORT/api/health" >/dev/null; then echo "Active $DEPLOY_TARGET commit: $COMMIT"; exit 0; fi
    sleep 1
done
echo 'Health check failed; restoring the previous release.' >&2
if [[ -n $PREVIOUS ]]; then ln -sfn "$PREVIOUS" "$BASE/current.next"; mv -Tf "$BASE/current.next" "$BASE/current"; systemctl restart "$DEPLOY_SERVICE"; fi
exit 1
