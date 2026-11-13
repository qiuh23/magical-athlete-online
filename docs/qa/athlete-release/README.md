# Integrated athlete environment and mechanism release

This report supersedes the **historical candidate/default-off** descriptions in the earlier v2/v3 checkpoint reports. The recovered environment and new lamps are new versions, not the lost tested tree or original missing lamp files. Local checkpoint SHAs in the older reports are provenance records, not promised public GitHub links. Release admission depends on precise content, geometry, actor, path and timing identities, never a local commit string.

## Normal entry and fallbacks

The lightweight entry adapter adds only missing `environment=1` and `mechanisms=1` switches before the lazy scene loads. Explicit switches, including `0`, empty/invalid/duplicate values, other query data, pathname, hash and history state keep their original semantics. Internal navigation preserves presentation switches without loading scene assets on the homepage. Seven-map output tests compare actual nodes, route coordinates, mounts and tree matrices with explicit dual opt-in. No track rule, special tile or network protocol changed.

The existing race menu exposes **automatic / day / dusk / night** scene lighting. Missing or invalid local preferences default to automatic; existing stored fixed values are preserved, without assuming they were actively chosen. The automatic cycle is 180 seconds of this browser tab/session’s visible, connected, unpaused race time, continuous across rounds in the same room. Its phase is saved in sessionStorage for same-tab refresh/reconnect; it is not a cross-tab or browser-close persistence guarantee; offline, hidden, selection and result time is not added. It is not a room-shared server clock. Sky, source direction, main-light color/shadows, fixture emission and local light pools follow the same continuous phase. Manual selections smoothly approach their fixed preset; returning to auto approaches the continuing room phase. Economy permits four local spots and no additional spot shadows; full quality permits eight spots and at most two local shadow maps. See [the incremental extraction report](incremental-preload-lighting-timing.md) for the current lighting, preload and presentation changes. Most daylight keeps local lamps strictly off (phase ≤ 0.8; about the first/last 39 seconds of the cycle); smooth ramps preserve dusk 0.12 and night 1. Completely extinguished local lights are invisible to the renderer; fixture meshes and main-light shadows remain independent. No independent animation RAF is added. While automatic lighting is active on a demand canvas, a scoped cancellable timer requests at most 20 frames/s, or 10 in economy. It stops when paused, hidden, disconnected, outside the race, on an always-rendering canvas, or unmounted. Existing frames do the actual lighting work.

The main WebGL failure layer keeps the minimap, detail, menu, chat and roll controls usable. A dice Canvas failure preserves authority-confirmed numeric dice output and the existing settled/read-time/pause lifecycle, so ordinary waiting can finish without Skip. Retry does not invent a result. This is a working DOM fallback, not proof that WebGL rendered.

## Finite physical coverage

- The new scene admits 39 exact non-Punch hardware domains: 11 Gain, 4 Loss, 12 Warp and 12 common Trip positions, subject to actual actor, layout, occupancy and loading guards.
- Common Trip action admission is **24 exact isolated full-quality normal unmounted banana fixtures**, covering desktop/compact, supported fall, down and recovery. Historical Trip source geometry remains unchanged; the new scene has independent external-geometry evidence.
- Rebuilt Punch r1 admits **12 exact trajectories**: Wild23 forward and Wild24 backward, banana full/economy and Coach full, desktop/compact. Minimum presentation window is 650 ms. Its real GUI and offline audit share `r1ActorPosition`; stride and compact rotation are not applied twice.
- Another 12 devices are **park-only**, not working-contact claims: 10 legacy Punch anchors and the two native Trip anchors. Wild16 remains cue-only because adequate terrain support was not established. These, the 39 domains and the two r1 positions cover 53 of 54 fixed anchors conditionally; this does not mean all hardware is visible or active for every racer or crowd.
- Unknown forms, mounted or unverified actors, incompatible quality, short/late/retimed beats, nearby or same-cell crowds, custom spacing, missing current-scope assets or invalid snapshots degrade to the real event cues. Score deltas, paths, legal results and authoritative rules continue unchanged. Scene, deck pads, mechanism source and actor readiness are independent guards. Failure is sticky within its scope until the explicit retry path.
- Retiming an admitted beat cancels physical action and cannot reauthorize it by restoring the previous speed. The cancelled Trip pose is held through subsequent Layer samples until the next beat; already-down state and legal recovery remain intact. This guard also protects explicit environment-off legacy controllers without rewriting their frozen sources.

## Combined evidence

The final combined checkout reran all 12 r1 world trajectories at 101 times against the actual environment, lamps, approved non-Punch hardware, support tongue, final park-only fixtures and final center-column foundations. All 1,212 world samples had zero unexpected external or actor intersections. The existing actor evidence contains 12 × 401 poses, with soft contact confined to its verified interval and an upper separation translation of 18.3033 mm (not a claim of minimum penetration depth). All 1,212 actual joint/self samples pass their bounded interface rules.

The non-Punch scene proof and its original report remain intact. The final r1 center-column change has an explicit, independently reproducible amendment and reverse-envelope separation evidence. Final r1 input identity was regenerated **after the actual combined world replay**, not by editing a certificate hash to suppress a mismatch. No new scenery or lamp matrices changed during release integration. Runtime/UI guard changes only narrow admission; their behavioral regressions are recorded separately.

The repository-wide source manifest, its hash-lock test and generator have been removed at the project owner’s request. Git records the submitted source revision; functional tests, build checks and scoped geometry evidence remain the validation basis. `preserved-inputs.json` records byte-identical legacy geometry, plan, cache, build and rule inputs.

## Assets and performance bounds

The source-derived 22 environment GLBs total 4,380,220 bytes / 93,971 triangles / 94 primitives, counting each file once. Five rebuilt lamp parts add 57,888 bytes / 992 triangles / 6 primitives; two assembled fixtures use 2,008 triangles, including foundations. The r1 model is 474,808 bytes / 9,612 triangles / 22 primitives; both rigs use 19,224 triangles plus 36 foundation triangles. These are geometry/batch budgets, not measured FPS.

Environment requests remain current-map only, sharing common source geometry/materials. No environment assets are requested when explicitly disabled. Retry clears the exact GLTF array keys. The existing content-addressed asset loader remains first in Board3D; cache and deployment workflows are unchanged. All 22 environment + 5 lamp + 1 r1 GLBs are byte-checked through both build products: 56 mappings total.

Per-map environment budgets, exact source transforms and LOD trade-offs remain in the v2/v3 reports. Bridges is the heaviest geometry. Economy does not claim lower polygon counts where it merely disables shadows. Hardware/park hiding may use zero-scale instances and is **not** claimed as eliminated vertex submission. Trees genuinely repack active instance counts; the safety audits still include all initial trees.

## Verification limits

- Geometry evidence is finite sampled triangle/containment evidence, not continuous collision detection or full-roster/all-crowd authorization.
- Real responsive DOM checks use official browser viewports. They are separate from the unavailable WebGL renderer and are not true-phone GPU testing.
- The two representative night images are Blender renders of actual runtime geometry. They have no racers, numbers or HUD. Local pools/directions are visible; the dark Boardwalk overview does not establish nighttime game readability. Existing numbers/cues use unlit, non-tone-mapped materials or DOM, but actor readability and Three/Blender color equivalence remain unverified.
- No FPS, full browser E2E suite, real-device WebGL or live CDN/cache claim is made. The existing build emits large-chunk advisories.
- No remote publication, merge or deployment was performed by this local integration task. A Worker `deploy --dry-run` is a local compile only.

## Reproduce local checks

Run the existing full Node test command, both TypeScript configs, `node scripts/build-sites.mjs`, both `verify-built-*` scripts and `wrangler deploy --dry-run`. The raw collision scripts under `scripts/recovery/` remain available for the relevant changed inputs. See `checks.json` for the actual final outcomes and `dom-checks.json` for the separate actual-browser scope when present.

## Automatic lighting continuation

The 180-second choice follows existing ordinary dice presentation (2,500 ms), movement (800–2,200 ms), and reading/ability windows. A roughly 45-second phase transition is observable across several basic turns, with a full cycle across tens of ordinary turns; this is a code-based estimate, not measured mean match length. Playback speed only changes beat duration, never the local lighting clock.

The App owns the room clock because Race/Board unmount between rounds. Its key includes effective backend, room code and creation identity, excluding round, track and snapshot version. Without a creation identity, the phase remains in memory and is not restored across page loads. Session storage contains only a bounded phase, not an offline timestamp. The server snapshot exposes current pause state but no cumulative shared active-game duration, so clients and tabs may have different lighting. No protocol or rules change is included.

Both approved-environment and fallback/explicit-environment-off paths now use the same continuous lighting adapter. Lamp hardware only mounts after environment readiness; missing/failed assets keep sky/main lighting working without silently turning on unsupported spotlights. All mechanical geometry, positions and bounded collision evidence remain byte-identical. The lifecycle/clock regressions are separate from the existing finite geometry evidence.

The final automatic-lighting continuation and exact validation scope are recorded in `automatic-day-night.json`; previous `checks.json` remains the pre-automatic checkpoint record.
