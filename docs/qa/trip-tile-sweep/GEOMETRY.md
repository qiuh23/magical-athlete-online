# Trip sweep geometry review

Baseline: `2690d066e055146f12a6d808d42e074eac04a9fa`.

## Final result

- **140 mounted runtime scenarios passed**, with no geometric/ordering failures, no asset-load failures and no fallback plans in this matrix.
- **151 selectable original character models passed on both Wild5 and Wild17**, giving 302 additional single-occupant desktop/standard checks. These project each model into the same confirmed trip presentation fixture; they do not claim that every character's ability or immunity rules naturally trigger that event.
- The runtime source hashes were unchanged from beginning to end of both runs, agree between runs, and were checked again when this evidence was packaged.
- Every authorized target in the 140-scenario matrix had an independently observed sculpture-foot/lower-body intersection before its fall began. All targets were down by phase `.94`; all mechanisms were parked by `.99`.
- The full-cycle crowded probes observed no intersections between the moving mechanism and non-target visible bodies, including ownership bases, already-down characters, mounts, and the new upper boom, hanger, shaft and hub. Non-target Pawn placement/fall transforms and authoritative racer data remained unchanged. Ordinary idle sculpture animation is not asserted to be frozen.

See [geometry-summary.json](geometry-summary.json), [runtime-matrix.json](runtime-matrix.json), and [roster-contact-checks.json](roster-contact-checks.json).

## Coverage

The 140-scenario matrix consists of:

- 56 cases: Wild5 native and Wild17 telescopic origins, seven representative roles/forms (banana, coach, centaur, kraken, hotel, mounted hog-knight and were-form bite-mark), desktop/compact layouts, and standard/economy quality.
- 48 cases: banana on the other twelve trip anchors, both layouts and quality tiers. Together the matrix covers all fourteen current trip anchors across Wild, Squiggle and Boardwalks.
- 24 cases: two authorized targets, eight authorized targets, and a four-pawn scene with standing/already-down bystanders, across both principal rigs/layouts/quality tiers.
- Eight cases with eight occupants but only one authorized target, including already-down and mounted bystanders.
- Four additional fast-mode/lifecycle scenarios. Fast mode uses the actual resolved 1,000 ms floor.

The eight-authorized-target cases include blimp in addition to the seven core roles. Contact times are per target, not a single time assigned to the whole cell.

## Independent method

`verify-trip-sweep-geometry.cjs` mounts the actual private `Pawn` implementation and `FullCoverageMechanismLayer` through React/R3F. `Pawn` is exported only in an in-memory TypeScript compilation; runtime files are not rewritten. Original GLBs are read locally, the actual evaluated meshes are collected, and the renderer itself is a no-op.

All runs use `?environment=1&mechanisms=1`. Wild5 desktop `boardPoint` is `[1.025, 1.65, -3.075]`; the Pawn starts at Y `1.655`. These coordinates are scene units, not calibrated physical metres. This is the raised mechanism layout, not the legacy low track. The query and board points are recorded in the reports and snapshots. R3F's frame clock advances monotonically even when the test presentation clock is reset or bisected.

The contact oracle is independent edge/triangle surface intersection with a QA BVH. It does not call the planner's triangle/box SAT as proof of contact. Target foot geometry consists of original sculpture triangles clipped at the sculpture's lowest Y plus `0.32 × pawn scale`; the ownership pedestal is excluded from target-foot evidence. Non-target protection checks use the complete visible Pawn body, including pedestal and cap. Both the initial pre-fall geometry and currently evaluated visible bodies are examined.

Each main case samples 201 phases from zero through one. Observed first-contact/fall transitions are refined locally. The 151-role extension samples around each proposed contact time and selected return phases rather than repeating a full 201-frame sweep for every model.

A separate consistency diagnostic compares planned solid bounds to actual rendered box-mesh bounds. The maximum discrepancy was below **6.4e-9 scene units**. First planner captures and completed mounted snapshots agreed within **1e-15 scene units** in the final crowded cases.

## Ordering, pause and repetition

Actual mounted checks cover:

- A 60-second pause on the shared `PresentationClock`, followed by resumption without phase consumption.
- Pausing midway, switching standard to economy, then resuming. Device/Pawn phase and the existing contact plan are retained.
- A repeated snapshot with the same beat key. The plan is retained and the planner runs only once.
- New beat keys, reduced-motion endpoints, then restoration of motion.
- Ordinary character-trip effects remain visible without a mechanism contact gate; a track-trip marker waits for its actual target contact.

The artificial moving-clock pause stress probe is also recorded. It is not the production pause contract: callers must freeze the shared presentation clock rather than continue advancing it with `paused=true`.

## Performance and corrected counterexamples

The final mounted matrix measured a median planner call of **3.32 ms**, and a maximum of **51.43 ms** in this container. This is synchronous function timing, not browser FPS or a universal upper bound. The exact triangle BVH and candidate pruning removed the earlier multi-second crowded planning cases without replacing exact target contact with proxy-box hits.

The independent review found and retested these concrete problems during implementation:

1. The old outboard demonstration never intersected the sampled target meshes, but still triggered a timed fall.
2. A direct low rod crossed an already-down bystander; the revised lifted transfer and short distal sweep avoid that sampled configuration.
3. Excluding ownership bases from bystander geometry allowed the upper boom to cross a fallen base. Targets still use sculpture-only foot contact, while bystander protection now includes the full visible body.
4. Initial skinned-body capture used stale `bindMatrixInverse` transforms, producing errors of several scene units. Invoking the correct `SkinnedMesh.updateMatrixWorld` path before capture eliminated the discrepancy. The final snapshot comparisons above verify the correction on actual assets.

## Offline preview

`trip-sweep-contact-preview.png` and the optional delivery-only `trip-sweep-offline-preview.gif` are generated from the **final runtime's evaluated meshes**. They are explicitly labelled offline previews, not browser screenshots. The cream tile is a QA elevation guide; the venue is omitted. The GIF follows the final phases: sweep to `.60`, raise to `.66`, retract to `.80`, return to `.98`. Its final 800 ms frame hold is for preview readability only and is not an additional runtime wait. The GIF is delivered separately and is not included in the code patch; the PNG is retained in the repository. Intermediate GLBs are not stored in the repository.

## Reproduction

```sh
node --import tsx scripts/recovery/verify-trip-sweep-geometry.cjs /tmp/trip-matrix --export
node --import tsx scripts/recovery/verify-trip-sweep-geometry.cjs /tmp/trip-roster --roster-only
blender -b --python scripts/recovery/render-trip-sweep-preview.py -- /tmp/trip-matrix
python3 scripts/recovery/assemble-trip-sweep-preview.py /tmp/trip-matrix
```

Optional focused diagnostics use `--quick`, `--problem-only` or `--crowd-only`. The additional export-only crowd illustration helper is `export-trip-sweep-crowds.cjs`.

## Limits

These are finite sampled geometry checks, not continuous collision certification. They do not certify every future state, arbitrary combination of role/form/mount, or collisions with venue scenery, floor, audience, lights, other parked machines, or one falling Pawn against another. Browser/GPU rendering and real mobile pixels were not verified here. The `bodyHit.point` and `footHit.point` report fields identify a device triangle centroid for context; they are not claimed exact contact coordinates. No original art/public assets were edited, and no publication, deployment or commit was performed by this review.
