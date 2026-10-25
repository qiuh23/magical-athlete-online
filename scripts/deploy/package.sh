#!/usr/bin/env bash
# Build on a Linux CI/builder with the same CPU architecture as the instance.
# Usage: bash scripts/deploy/package.sh <full-reviewed-sha> /absolute/path/release.tar.gz
set -euo pipefail
[[ $(uname -s) == Linux && $(node -p 'process.versions.node.split(".")[0]') == 24 ]] || { echo 'Build using Linux and Node 24.' >&2; exit 1; }
COMMIT=${1:?Pass a full reviewed commit SHA}
OUTPUT=${2:?Pass an absolute output archive path}
[[ $COMMIT =~ ^[0-9a-f]{40}$ && $OUTPUT == /*.tar.gz ]] || { echo 'Require a full SHA and absolute .tar.gz output path.' >&2; exit 1; }
git cat-file -e "$COMMIT^{commit}"
[[ ! -e $OUTPUT && ! -e $OUTPUT.sha256 ]] || { echo 'Output already exists; choose a new path.' >&2; exit 1; }
WORK=$(mktemp -d)
trap 'rm -rf -- "$WORK"' EXIT
git archive "$COMMIT" | tar -x -C "$WORK"
cd "$WORK"
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm prune --prod
node --input-type=module -e 'import fs from "node:fs"; fs.writeFileSync("release.json",JSON.stringify({commit:process.argv[1],platform:process.platform,arch:process.arch,nodeMajor:24}));' "$COMMIT"
tar -czf "$OUTPUT" dist/client dist/server node_modules package.json pnpm-lock.yaml release.json
(cd "$(dirname -- "$OUTPUT")" && sha256sum "$(basename -- "$OUTPUT")" > "$(basename -- "$OUTPUT").sha256")
echo "Production bundle: $OUTPUT (copy together with .sha256 via SSH; no on-instance compilation or npm download required)."
