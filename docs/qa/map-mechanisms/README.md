# Map mechanisms: review candidate

## Rollout status

This draft integrates real map events and supplied articulated assets. It is **not** a claim of universal physical contact or finished environment art. It remains opt-in with `?mechanisms=1` until the actual browser/HUD screenshots from the existing manual CI suite are reviewed. `?mechanisms=0`/omitting the flag retains the stable board. No rule, node order, branch, turn timing, score rule, deployment setting or secret is changed.

Local Chromium cannot create its process-singleton socket. The official cloud browser also returned `ERR_CONNECTION_REFUSED` while the local Vite session was alive and two curl checks returned 200. Therefore local WebGL, real mobile usability and FPS are **not verified**. Blender images in the separate delivery are exported runtime geometry, not game screenshots, and omit HUD/canvas textures. Landscape orthographic export was corrected to `max(width,height)/zoom` and checked against the Three projection.

## Actual coverage

| Map | Nodes | Fixed anchors | Candidate visual transform |
|---|---:|---:|---|
| Mild | 31 | 0 | unchanged |
| Wild | 31 | 10 | +1.43m deck lift, original planar spacing |
| Squiggle | 31 | 13 | +1.43m, uniform planar scale 1.212183 |
| Boardwalks | 59 | 19 | +1.43m, uniform planar scale 1.994580, all 61 edges retained |
| Bridges | 31 | 0 | unchanged, all four upper/lower crossings retained |
| Twisty Twirl | 31 | 0 | unchanged, 13→14 twist boundary retained |
| Whirly World | 31 | 12 | +1.43m, original planar spacing; six real warp pairs |

54 fixed anchors: 13 Punch, 14 Trip, 11 Gain, 4 Loss, 12 Warp endpoints. Dynamic trampolines/NPC skills/one-time coins remain under their existing rules and are not converted into permanent mechanisms. Compact means width ≤650; 844×390 retains desktop orientation. All click points, pawns, paths, scenery bounds, minimap and cameras use the same display mapping. No role or working head is scaled down to fit.

| Mechanism | Live implementation | Physical/visual limits |
|---|---|---|
| Gain, 11 anchors | actual score delta, owner-specific bounded gold flow from palm, articulated arm when eligibility allows | Shared-cell arm animation still held. Fixed cabinet moved .85m along its local +Z, never chases a pawn. Full 608-form/quality static audit with conservative hulls for open parts clears the moved assembly. |
| Loss, 4 anchors | actual clamped debit, zero means zero particles; target→horn flow; actual arm/head clip | No invented −3 debit when only 2 points existed. Non-target residents are not animated. |
| Warp, 12 endpoints | real destination, full-size target-only fade; hinge amplitude capped at 20° | Full static standing/native-down domain checked, but shared-cell doors remain held. Banana full/economy single-resident↔two-person reflow is smooth and checked. Other occupied transfers hide the target through the final snapshot, then restore at the correct slot. This avoids known 4→5/5→4 crossing paths, not an optimized crowd-slot system. |
| Legacy Punch | Wild24: observed empty preparation on 23→24, then standing single banana 24→23→22, normal/economy, two display layouts | Real motion.path, persistent READY history, no occupied-cell deployment sweep. Other arrows retain movement and noncontact cue. New adjustable Punch research is **not installed** in this draft. |
| Legacy Trip | Wild5 desktop: validated 4→5 arrival, one previous down banana plus new left-slot banana | Exact IDs, down edge and occupancy history; old resident moves aside during arrival but stays down, then does not repeat the fall. Other Wild5 cases and Squiggle17 remain cue-only. |
| Telescopic Trip | 12 fixed mounts, 54 exact offline-certified single-target plans, actual geometry hash and fixed world transform matched | This is a finite lookup, **not** a runtime arbitrary-role solver. See exact scope below. |

### Certified Trip scope

- Full-quality banana: 12 anchors × desktop/compact = 24 entries.
- Five additional actual variants on one representative anchor in each of three maps, both layouts = 30 entries: Wurstii Frogger, Coach, Leaf Race Car, Bite Mark in were-mouth form, and mounted Banana.
- Only one standing target, no other non-eliminated actor within six metres, an already loaded rigid/bind sculpture, completed occupancy reflow, recorded idle neighbors and a ≥650ms window qualify. Full geometry SHA, current position/scale, mount matrix and layout must match. Missing/late/changed data falls back for that entire beat.
- Economy geometry, unlisted character/form/anchor combinations, two/four/eight occupants, nearby actors, repeated trip on a down pawn and overlapping device events are cue-only. The algorithm used to produce the table accepts broader geometry; the shipped runtime does **not** silently generalize its evidence.
- All 54 outbound paths have 41 finite samples plus 21 return-to-park samples. Authored self evidence is the exact frozen 403-pose synchronized-stage domain. These are finite sampled checks, not continuous proof or a physical actuator-speed guarantee.
- New fall begins at .32 and reaches the independently supported down pose at .80; .80–1 retracts/parks the mechanism. The existing presentation duration is unchanged. Pauses share the existing clock. A new per-target quaternion/support pose persists until recovery and never replays old down state.
- Interruption hides the affected mechanism for the current scope instead of instantaneously rotating/extending through a pawn. A completed pose can be recovered from same-scope session display cache, never as permission to replay contact. Shape/mount changes display the real new form and use a floor-supported static fallback in the saved direction, without new contact authorization. A certified down pawn retains its full-quality geometry through recovery if the global quality setting changes; other scene objects switch normally.
- Park audit: 96/96 standing same-cell envelope cases and 9344/9344 neighboring-node static cases clear. Native-down 87/96 clear; the three uncertain anchor/layout combinations (Squiggle5 compact, Boardwalk19 desktop, Boardwalk23 compact) hide hardware for unrecorded native-down occupants except the certified two-person static domain. Counts outside 1/2/4/8 and unverified custom down directions also hide the affected hardware. This does not prove arbitrary arriving trajectories or skeletal idle motion.

## Three concrete scene fixes

1. Gain cabinet's .85m fixed local offset clears its former base/body intersections. Road/full-mat and neighboring-device audits were rerun for this placement.
2. Warp old residents complete the checked reflow while the target is invisible, before it fades in. Unchecked crowded reflows use the hidden-until-snapshot transition. Reduced-motion mode cannot bypass this hiding. Material ownership is restored on skip, model/quality replacement and completion.
3. Wild5 bleachers and spectators move +.25m together. Its Trip foot is trimmed **only from below**, 35mm, keeping the top and every working joint fixed, to meet paving at Y=.235. Squiggle17's one (+X,+Z) column stops at the foot top Y=.40 and retains its original taper (bottom radius .123333 rather than .13). Original source assets are not overwritten. The eight old/new-rig × two-layout support checks clear. Boardwalk23's 25nm coplanar foot/foundation contact is an explicit support interface, not positive-depth penetration.

## Performance and scene boundaries

Approved soft mats retain the dark tread, colored perimeter and copper fasteners. The original 37 authored pieces are baked into five material batches with exact corner position/normal/UV/material comparisons. Full tile: 6812 triangles. Economy tile: 4712 triangles (31% reduction **for the tile alone**), five batches, simplified tiny grip marks only. Copper, shell, guard rails and landing surface are retained. Low quality removes these small geometry shadow submissions.

Idle old devices and new Trip devices are instanced by mesh/material; only current hardware owns dynamic clones. New Trip adds 4410 triangles per installed mount versus 2116 for the old Trip, and 19 shared primitive batches plus the active copy. Hidden zero-scale instance slots still submit vertices and are included in the budget, not counted as removed work. Score flow is at most 32 octahedra (16 economy), 256/128 triangles, one batch and no shadows/lights. No per-cell timer or unbounded RAF was added.

`geometry-budget.json` is the earlier course/scenery/old-device baseline, **not an updated whole-scene FPS measurement**. Add 2294 triangles per substituted Trip mount (Wild 2, Squiggle 2, Boardwalk 8), one trimmed support draw on Squiggle, and the bounded score flow. Pawns, extra Wild decor, HUD and other Board objects remain separate. A whole-renderer draw/triangle/FPS claim awaits browser instrumentation. Boardwalk's full-detail 59 mats alone remain approximately 402k triangles.

Ordinary tiles now have a high-contrast pale number on a dark patch. Focused node/path labels are at least 14px in screen space and avoid measured HUD safe zones; overview is intended to show route shape, not make every small tile number readable. Projection/layout math is tested, but phone readability is not yet visually approved.

Only the approved soft mat and devices were imported here. Existing ExpansionScenery, Wild infield plan/trees and other backgrounds remain the repository's scene, with the small obstruction fixes above. This does not import or claim completion of the later refined tree, start/finish, grandstand or per-map environment art; that is a separate follow-up PR.

## Reproduce and review

- Unit/type/build: `pnpm test`, `pnpm typecheck`, `pnpm build`.
- Real engine-arrival QA: Vite on port 5186, `/qa/mechanisms.html?mechanisms=1`.
- `pnpm exec playwright test -c playwright.mechanisms.config.ts` covers all maps, 390×844 / 844×390 / 1280×900, real arrow/Trip targets, pause, GLB retry, warp quality/skip restoration and finite certified Trip.
- Existing `.github/workflows/ci.yml` manual `browser_suite=all` now runs this targeted suite immediately after browser install and uploads `mechanism-screenshots` before the old suites. No permissions, secrets or deployment workflow is added.
- `certified-trip-evidence.json` records exact finite scope and source hashes; its source/asset hash test rejects changed geometry or layout without re-audit. `certified-trip-manifest.json` is the exact runtime plan table. Historical placement/source-clip reports are not substitutes for these new-rig certificates.

Latest local aggregate results are recorded in the PR and verification log. Real browser/HUD review remains pending; do not enable by default or call universal physical contact complete from unit tests alone.
