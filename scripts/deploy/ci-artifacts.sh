#!/usr/bin/env bash
# Package the exact build that just passed Checks, without rebuilding it.
# No cloud credentials are available in this job.
set -euo pipefail
COMMIT=${1:?full commit SHA}
TARGET=${2:?preview or production}
RUN_ID=${3:?GitHub run ID}
PR_NUMBER=${4:-0}
OUTPUT=${5:?absolute output directory}
[[ $(uname -s) == Linux && $(node -p 'process.versions.node.split(".")[0]') == 24 ]] || { echo 'Use Linux with Node 24.' >&2; exit 1; }
[[ $COMMIT =~ ^[0-9a-f]{40}$ && $(git rev-parse HEAD) == "$COMMIT" && $RUN_ID =~ ^[1-9][0-9]*$ && $PR_NUMBER =~ ^[0-9]+$ && $OUTPUT == /* ]] || { echo 'Invalid build identity or output.' >&2; exit 1; }
[[ $TARGET == production && $PR_NUMBER == 0 || $TARGET == preview && $PR_NUMBER != 0 ]] || { echo 'Invalid deployment target/PR.' >&2; exit 1; }
[[ -f dist/client/index.html && -f dist/server/server/index.js && -f dist/browser/index.html ]] || { echo 'Checks must build both clients and server before packaging.' >&2; exit 1; }
[[ ! -e $OUTPUT ]] || { echo 'Choose a fresh artifact directory.' >&2; exit 1; }
mkdir -p "$OUTPUT/aliyun" "$OUTPUT/worker/assets" "$OUTPUT/worker/worker"
WORK=$(mktemp -d)
trap 'rm -rf -- "$WORK"' EXIT
cp -a dist/client "$WORK/client"
cp -a dist/server "$WORK/server"
mkdir "$WORK/dist"
mv "$WORK/client" "$WORK/server" "$WORK/dist/"
cp -a node_modules package.json pnpm-lock.yaml "$WORK/"
(cd "$WORK" && CI=true pnpm prune --prod --ignore-scripts --yes)
node --input-type=module - "$WORK" "$OUTPUT" "$COMMIT" "$TARGET" "$RUN_ID" "$PR_NUMBER" <<'NODE'
import fs from 'node:fs';
const [work,output,commit,target,run,pr]=process.argv.slice(2);
const deployment={target,commit,runId:Number(run),...(target==='preview'?{prNumber:Number(pr)}:{})};
fs.writeFileSync(`${work}/dist/client/deployment.json`,JSON.stringify(deployment));
fs.writeFileSync(`${output}/worker/release.json`,JSON.stringify(deployment));
fs.writeFileSync(`${work}/release.json`,JSON.stringify({...deployment,platform:process.platform,arch:process.arch,nodeMajor:24}));
NODE
tar -czf "$OUTPUT/aliyun/aliyun.tar.gz" -C "$WORK" dist/client dist/server node_modules package.json pnpm-lock.yaml release.json
(cd "$OUTPUT/aliyun" && sha256sum aliyun.tar.gz > aliyun.tar.gz.sha256)
cp -a dist/browser/. "$OUTPUT/worker/assets/"
cp "$OUTPUT/worker/release.json" "$OUTPUT/worker/assets/deployment.json"
# This compile runs in the unprivileged Checks job. Deployment executes only
# the trusted main-branch orchestrator and sends this prebuilt module to CF.
pnpm exec wrangler deploy --dry-run --outdir "$OUTPUT/worker/worker"
[[ -f $OUTPUT/worker/worker/index.js ]] || { echo 'Missing precompiled Worker.' >&2; exit 1; }
echo "Packaged verified $TARGET build $COMMIT."
