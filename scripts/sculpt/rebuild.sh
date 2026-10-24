#!/usr/bin/env bash
# Reproduce assets only. Never pushes, creates PRs, or deploys.
set -euo pipefail
cd "$(dirname "$0")/../.."
BLENDER=${BLENDER:-blender}
BLENDER_ASSEMBLY=${BLENDER_ASSEMBLY:-.tools/blender/blender-5.2.2-linux-x64/blender}
"$BLENDER" --version | head -1 | grep 'Blender 4.3.2' >/dev/null || { echo 'Set BLENDER to Blender 4.3.2 for this reproducible build'; exit 1; }
"$BLENDER_ASSEMBLY" --version | head -1 | grep 'Blender 5.2.2' >/dev/null || { echo 'Set BLENDER_ASSEMBLY to Blender 5.2.2 LTS'; exit 1; }
[ -d .tools/sculpt/node_modules/@gltf-transform ] || { echo 'Install the documented local build-tool dependencies first.'; exit 1; }
mapfile -t ALL < <(python3 -c 'import json;print("\n".join(r["id"]for r in json.load(open("docs/sculpt-20261024/coverage.json"))["rows"]))')
mapfile -t ORIGINAL < <(python3 -c 'import json;print("\n".join(r["id"]for r in json.load(open("docs/sculpt-20261024/coverage.json"))["rows"]if r["edition"]=="original"))')
ARGS=();for id in "${ORIGINAL[@]}";do ARGS+=("--id=$id");done
"$BLENDER" -b --python-exit-code 1 --python scripts/sculpt/build-samples.py
"$BLENDER" -b --python-exit-code 1 --python scripts/sculpt/stabilize-motion.py
node scripts/sculpt/finalize-stage.mjs "${ALL[@]}"
"$BLENDER_ASSEMBLY" -b --python-exit-code 1 --python scripts/sculpt/assemble-sources.py -- --original
"$BLENDER_ASSEMBLY" -b --python-exit-code 1 --python scripts/sculpt/integrate-originals.py -- --economy-only "${ARGS[@]}"
node scripts/sculpt/assemble-originals.mjs "${ORIGINAL[@]}"
node --import tsx scripts/sculpt/measure-shipping.ts
node scripts/sculpt/extract-banana.mjs
node --import tsx scripts/sculpt/update-banana.ts
node --import tsx scripts/sculpt/validate-stage.ts "${ALL[@]}"
python3 scripts/sculpt/install-all.py
"$BLENDER" -b --python-exit-code 1 --python scripts/sculpt/assemble-sources.py
"$BLENDER" -b --python-exit-code 1 --python scripts/sculpt/audit-sources.py
python3 scripts/sculpt/update-source-evidence.py
"$BLENDER_ASSEMBLY" -b --python-exit-code 1 --python scripts/sculpt/audit-catalogs.py
# Optional exact-export previews (can take several minutes):
# node scripts/sculpt/decode-for-review.mjs "${ALL[@]}"
# PREVIEW_ARGS=();for id in "${ALL[@]}";do PREVIEW_ARGS+=("--id=$id");done
# "$BLENDER" -b --python-exit-code 1 --python scripts/sculpt/render-exports.py -- "${PREVIEW_ARGS[@]}"
# python3 scripts/sculpt/preview-catalog.py
# python3 scripts/sculpt/update-preview-manifests.py
pnpm typecheck
pnpm build
