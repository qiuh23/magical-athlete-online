# Source-derived environment rebuild v2 checkpoint

Historical checkpoint report for d6ced096. Later local clearance offsets and new-identity fixtures are documented in [the v3 continuation](../floodlights-rebuild-v3/README.md); the runtime geometry audit at this path is regenerated for that continuation. The saved d6 archive retains its original report and audit.

This is a **new candidate version**, not the lost `e58a97d` environment or `2a880f5` integrated tested tree. It completes a buildable, source-backed 22-asset/seven-map environment stage. It is not the final all-mechanisms delivery. No merge, deployment, production flag or new game rule is included.

## Identity and inputs

Base: `1cb3194912b25e5d0839ca06a0fe4f3fc6d89f49`, the verified PR66/cache compatibility recovery. All 22 GLBs live in `public/models/environment-rebuilt-v2/`. Their source package identities, source `.blend` SHA-256, selected objects, transforms, exporter hash, output SHA-256 and Git blob IDs are recorded in `asset-manifest.json` there. Export/revalidation commands and the tree trade-off are in `scripts/recovery/README.md`.

The source packages contain actual Blender geometry, not reconstructions from PNGs. Three landscape exports differ from the missing historical blob IDs and are explicitly `landscape_reexport_v1`. The three new LOD2 trees preserve source color boundaries through corner vertex colors, with two opaque texture-free materials. Elm/maple leaves look sharper and more fragmented close up; this is an explicit reduction trade-off, not recovered original LOD2 bytes. The standalone grove file itself was not recovered. Wild's six infield placements derive from the authenticated Mild source and are labeled as such in `source-layout.metadata.json`.

Package totals are **4,380,220 GLB bytes, 93,971 triangles, 94 primitives**, counting each file once, not a rendered frame. Independent source-to-export material/geometry/color checks, Three imports, and fresh Blender imports pass for all 22 assets.

## Runtime boundaries and retained scene

- `?environment=1` opts into the new environment independently of `?mechanisms=1`. Default is off. No new environment GLB request or preload occurs while off. Common trees/gates use one fixed five-URL `useGLTF` cache key; only current-map files use the second key. Retry clears those exact two array keys. Existing `asset-loading.ts`, URL modifier, persistent cache, service worker and build hashing are unchanged.
- `ApprovedEnvironment` replaces old scenery only after its actual geometry is built. Loading/error keeps the old scene and rules. The optional layer has its own failure boundary and retry. StrictMode setup constructs an owned kit in the effect; cleanup never disposes cached GLTF geometry/materials. Switching quality/map reuses source resources, not a full clone for every tree.
- Seven-map routes retain real `boardPoint`, node identities, connections, specials, bridge heights and Twisty reversal. Trees/props are not scaled to fit longer tracks. Only terrain contours scale in XZ. Rigid furniture connected components choose one source pocket and translate once; plants are also translated as rigid connected components.
- `RebuiltScenery` and `RebuiltMechanismCourse` are candidate-only partitions. Original `ExpansionScenery.tsx` and `mechanisms/MechanismCourse.tsx` remain **byte-identical** to the frozen legacy source inputs. Fourteen map/quality combinations separately compare `all` partition geometry buffers byte for byte. This does not grant the legacy contact certificate to the new scene.
- Classic unraised U maps retain their old base, numbered tiles and appropriate CarnivalDetails; old trees/decor/gates are suppressed when ready. Topology maps retain actual route tiles and BridgesRoads/route badges but use only the candidate `route` partition instead of old scenery. Raised mechanism routes retain deck, pads, labels and supports, not old device foundations. Natural maps remove old scenery completely on ready and use their source base/landscape/furniture; raised U maps retain only old ground. Wild's old StadiumDecor is suppressed on ready. Whirly's old combined stadium is replaced only on ready.
- U facilities use source high or explicit low plinth heights, not a second +1.43 lift. Stand, spectators and matching support retain the common +Z safety offset. This placement is a conservative input, not a collision pass. Mild/Twisty tree03 and Bridges tree06 retain local visibility offsets. START/FINISH signs are generated from actual endpoints and reverse with Twisty; no source lettering is claimed.

## Contact and event safety

Whenever `environment=1`, including pending/failed/ready states, old contact controllers cannot enter or restore a certified pose; old physical mechanism layers and foundations are not mounted. Match scope changes prevent a stale pose from leaking into this domain. Ordinary game rules and actor motion continue.

A separate, GLB-free `EnvironmentEventCues` layer preserves **event expression**, not hardware: new Trip recipients only; Arrow's real legal path; Warp's actual source and result, once; Gain/Loss's authoritative signed/clamped delta with per-target numeric labels and directed cosmetic particles. Zero delta emits no particles; all owners share a cap of 32/16 particles. The existing shared clock handles pause and reduced motion without a new timer/RAF. Reduced motion retains static lines/numbers and emits no flying particles. Existing RaceEffects, Pawn fade/reflow, score HUD and special-tile labels remain. Do not describe these as functioning physical devices.

Enabling contact again requires a new bounded combined-scene audit, not changing a hash or removing the gate. The old source hash certificate test passes only for its unchanged old inputs.

## Per-map new-layer budget

The following are **unculled submitted upper bounds for the new environment only**, with `mechanisms=1`, full quality, one main pass and at most one directional shadow pass. Excludes retained route/base/Carnival props, actors, other mechanisms, sky, HUD and event cues. Low quality uses the same LOD2 geometry, not a lower polygon claim; it disables all new shadows and merges shadow-tree batches. Full quality allows only two main foreground trees to cast shadows.

| Map | Bytes requested | Trees | Main triangles | Main draws | Shadow triangles / draws | Main + shadow draws | Low main draws |
|---|---:|---:|---:|---:|---:|---:|---:|
| Mild | 1,819,388 | 6 | 44,498 | 49 | 32,195 / 41 | 90 | 45 |
| Wild | 1,819,388 | 6 | 45,814 | 56 | 33,511 / 48 | 104 | 52 |
| Twisty Twirl | 1,819,388 | 6 | 44,498 | 49 | 32,195 / 41 | 90 | 45 |
| Whirly World | 1,819,388 | 6 | 45,814 | 56 | 33,511 / 48 | 104 | 52 |
| Curves / Squiggle | 1,844,420 | 14 | 63,870 | 39 | 13,072 / 22 | 61 | 37 |
| Boardwalks | 1,915,580 | 10 | 54,767 | 40 | 16,475 / 24 | 64 | 38 |
| Bridges | 2,143,720 | 27 | 113,433 | 40 | 14,775 / 24 | 64 | 36 |

Camera-dependent culling repacks live tree instances and reduces `mesh.count`, never zero-scales hidden trees and claims saved work. All initial trees still appear in the geometry audit, including camera-hidden ones. Bridges is the heaviest retained geometry. Actual triangles after culling and low/full branches are listed in the audit. These are not measured draw calls, GPU timings or FPS.

## Reproduction and evidence

```sh
node --import tsx scripts/recovery/audit-environment-runtime.ts
node --import tsx --test tests/environment-event-cues.test.ts tests/map-environment-rebuild.test.ts tests/map-mechanisms.test.ts tests/mechanism-certificate-assets.test.ts tests/asset-recovery.test.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/tsc -p tsconfig.worker.json --noEmit
node --import tsx --test tests/*.test.ts tests/host.test.mjs
node scripts/build-sites.mjs
node scripts/recovery/verify-built-environment.mjs
```

`runtime-geometry-audit.json` records 28 map/layout/quality states with actual options, matrices, initial instances and geometry SHA-256, plus two deterministic camera-direction probes per state. The exact `buildEnvironmentGeometry` function is shared with the live layer. An external collision reviewer must also compose the retained route/base listed above, compact parent rotation and every other mounted entity. Decorative/hidden roles are not collision exemptions. The digest is input identity, not a collision certificate.

Known failures were not erased:
- Initial decimation validation found material-group counts different by 6/6/5 duplicate bark faces. Explicit mesh validation before snapshot/export fixed this; no tolerance/assertion was relaxed. Details and source-vs-LOD isolated renders are in the asset reports and external evidence archive.
- First integration touched two frozen legacy source files, so the certificate source-hash test correctly failed. Candidate-only files and restored original bytes resolve it without rewriting certificate metadata.
- Initial event cue tests started their event IDs at 2/3/4, so normal gap detection correctly withheld those beats. Fixtures now start at 1. An aggregate-owner cap fixture explicitly combines queue events instead of assuming presentation merged independent score beats.
- The CLI `tsx` wrapper had an IPC setup restriction. `node --import tsx` runs the same Node tests without that incidental CLI server.

The current checkpoint's final log/status summary and cache output checks are in `checkpoint-checks.json` and `built-asset-verification.json`. Vite still reports the existing large-chunk advisory; it is not a new FPS assessment.

## Not yet complete

1. Five historical `fl_*` light templates remain unrecovered. No PNG is treated as model source, and no fixture is silently substituted. Existing unified day/night lighting remains; this stage adds no local floodlight pools or night-light acceptance claim.
2. Rebuild bounded replacement lights under new identity: source/reference-supported mast, stable base, head/yoke/lens; local aiming and receiver-plane illuminance calibration, unified day/night shadow behavior and no independent RAF. Freeze before geometry/contact audit. Do not repeat indefinite searches for lost bytes.
3. Physical event integration requires a fresh finite audit of actual PR66 Trip/legacy paths against all new scenery and retained layers, followed by the separately rebuilt Punch joint/contact evidence. Safe fallbacks can be conditional, but disabling every device is not final delivery.
4. Real WebGL, mobile portrait/landscape interaction, cache/network behavior on load/retry/refresh, viewport pixel visibility and day/night GPU appearance remain unverified. A normal supported browser on an authorized preview is required. The official cloud browser cannot reach local Vite, and the separate official Firefox headless attempt failed before a page/WebGL context existed. No security flags were weakened.
5. Isolated asset renders are not final runtime-scene/HUD images. Representative integrated day/night and phone views should follow restored lights and the actual browser check; offline views must be labeled offline and cannot replace WebGL acceptance.
