# Finite rebuilt-scene mechanism admission

This is a new combined-scene check and runtime consumer. The original MechanismLayer, CertifiedTripLayer, Trip controller/manifests, machine models, old certificate source hashes and gameplay engine stay unchanged. It is not the lost prior certificate. Candidate flags remain default-off; final promotion belongs to the parent integration task.

## What is actually usable

The generated `src/client/scene/environment/scene-mechanisms-manifest.json` is the runtime allowlist, not the historical Trip manifest. Of the 54 map anchors (41 non-Punch and 13 Punch), this stage covers 39 non-Punch/common-Trip anchors. The native Wild5 and Squiggle17 Trip mechanisms are not inherited from their old certificates. Current scene checks admit 11 Gain, 4 Loss and 12 Warp hardware/motion mounts, plus parked common Trip mounts. Exact isolated full-quality banana profiles admit 24 Trip fixtures in desktop/compact layouts, including Wild17 and Wild26. The active Trip consumer retains the actual supported fall, down state and recovery. Same-cell later arrivals and repeat trip events cannot refall or move the already-down racer.

- Wild13 Gain now has a real 1 m by 2.2 m solid support tongue joined to the existing base over a bounded inner 1.05 m attachment region. Its fixed machine mount, foot and working geometry were not changed. The tongue, foundation, route, scenery and neighboring devices were rechecked.
- Squiggle5's first single-axis soft-contact bound was too conservative. The final audit projects every real vertex onto actual face normals and bounds a translation that separates the complete meshes. It changes neither plan nor geometry nor the 2 mm limit. Across all 24 fixtures the maximum bound is 0.45028 mm.
- Nonmatching actor geometry, mounted/other forms, economy actor geometry, crowds, another moving actor, missing assets, arbitrary mechanismSpacing, and unverified Trip plans retain the actual event/score/route cue. Their game results are not changed or forced to match an animation.
- Hardware near unknown geometry is hidden conservatively. Exact actor snapshots are taken after static bind, including base/cap and authored sculpture transforms. Other actors are excluded by conservative spheres of their actual geometry, not by identity guesses. Warp origin and destination are both treated as occupied throughout the transition, including an already-updated authoritative endpoint.
- Gain/Loss use unchanged event actions and original authored joint clips. The independent cue layer carries signed/clamped score deltas, zero-delta behavior and all owner labels. Warp uses exact actual endpoints and narrowed original door poses; it does not create additional motion or targets.

## Actual geometry and sampling

Run from this checkout:

```
node --import tsx scripts/recovery/audit-scene-mechanisms.ts
node --import tsx --test tests/scene-mechanisms.test.ts tests/scene-collision.test.ts
```

The audit loads the actual 22 environment GLBs and five rebuilt light GLBs, uses the shared live `buildEnvironmentGeometry`, `buildFloodlightGeometry`, `buildRebuiltDeck`, and `buildRebuiltPads` builders, and includes retained U-map ground. Initial tree instances remain present even when camera-hidden. All map geometry is checked in the real mechanism layout. The actual r1 Punch parked meshes, real derived foundations and its separate finite motion envelopes are included as neighbors. The final Wild23 fixed local Z is −.36, not the preliminary −.25. Wild24 remains −.25; the final mount-envelope SHA-256 is 9d11128dd5efb7233f799d0f8bee461e8658527f5244e811ff4f23b2b3a089c8.

The legacy deck JSX was extracted without changing geometry into a shared candidate-only builder. New foundation footprints match each real source foot plus a 20 mm edge. Their upper plane meets the unchanged foot at Y=.20; the lower datum comes from actual terrain ray intersections. They are explicit rendered solids, not collision proxies or shrunken mechanisms. Terrain/foundation penetration is allowed only within a 3 mm lower-interface slab; foot/foundation contact is confined to its upper plane within 20 microns. The Wild13 tongue/base attachment additionally has a fixed, small local connection box. No entire object pair is exempt.

Device motion uses 51 samples per original action. Exact banana Trip fixtures replay 51 fall times, the completed down state, and 51 recovery times, including every phase boundary. Both desktop and compact actor orientations are tested. Registered actor fingerprints match the production snapshot algorithm and full source triangle order. The pad identity is `7ca87e14c06e410144d2e5fbd66303605c2a442f4fae7c0928a62c5eef28c659`, never the obsolete native Trip contract's `3b5710...`.

Broad bounds only reject separated pairs. Overlapping pairs use actual triangle BVH tests and bidirectional containment against closed connected components. Containment rays must agree; disagreement is a failing uncertain pair. Duplicate material/normal vertices are welded only for connectivity, without changing collision positions. Numerically zero-area triangles at generated lathe poles are excluded from the collision index, because the triangle library otherwise returns false surface intersections outside the target triangle. This does not change the actor fingerprint or rendered geometry. Surface and support results retain witnesses; allowed soft contact is checked at every sampled time and cannot suppress later deeper contact.

`independent-motion-exclusions.json` separately records disjoint full sampled Warp endpoint envelopes and r1 Punch/non-Punch envelopes. A non-disjoint bound is not accepted as penetration or silently ignored: that step fails and requires actual narrow phase.

## Provenance and limits

`audit.json` preserves every discovered failure and allowed interface for the current frozen scene. The three initial scene failures were real triangle crossings, not mere broad-box overlap: Wild1 Gain with podium/plinth, Squiggle13 Loss with a sapling, and Squiggle19 Gain with an elm. The environment worker moved the complete objects and the audit was rerun. No machine geometry was shrunk.

The source/data/GLB SHA-256 inputs are pinned in the new manifest and tested independently. Any relevant builder, source asset, placement, driver or plan change requires regeneration. Source hashes do not stand in for collision evidence. The environment/lighting source checkpoint is 1fd9f8d10439560f356484ef09ffefa38047d8bd. The original published rig/plan domain is reused unchanged as an input; this audit is the new external-scene/finite-actor extension, not a new arbitrary self-collision solver or full-roster authorization.

This is finite sampled evidence, not continuous collision detection, a 151-character sweep, browser interaction QA, mobile/WebGL verification, or an FPS claim. Browser and phone checks were not performed by this worker. No PR, push, merge to remote or deployment was performed here.
