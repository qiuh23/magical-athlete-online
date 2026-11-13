# Perimeter floodlight rows

Eight fixed fixtures form two four-lamp perimeter rows. All lenses fade together; metal housings stay opaque and dark. Full quality uses six real spots and one 1024² local shadow map, identically on desktop and compact views. Explicit economy uses four real spots without local shadows but retains all eight fixtures and luminous lenses. The five existing GLBs are unchanged. Sky, exposure, clock and gameplay drivers are unchanged.

## Reproduce

From the repository root with dependencies available:

- `node --import tsx --test tests/rebuilt-floodlights.test.ts tests/automatic-scene-lighting.test.ts tests/floodlight-edge-mounts.test.ts`
- `node --import tsx scripts/recovery/audit-floodlight-row-lighting.ts`
- `node --import tsx scripts/recovery/audit-floodlight-row-joints.ts [environment-checkout] [lighting-checkout] [output-directory]`
- `node --import tsx scripts/recovery/audit-floodlight-row-sightlines.ts [lighting-checkout] [output-directory]`

Checkouts default to the current directory. The joint audit needs the matching segmented seating implementation: recorded environment hashes in `joint/observation.json` identify that input exactly. For an integrated tree, omit both checkout arguments. No script updates runtime authorization manifests. Existing manifests must be reconciled only after the integrated real-geometry delta review.

The joint check uses actual triangle meshes for lamps, seating and the principal runtime course branches: DioramaStadium native stadium-v7 blocks for full Mild, the actual classic base/course for Mild/Twisty, TopologyStadium and BridgesStructure for Bridges, and rebuilt pads/decks for raised tracks. Protected envelopes are frozen conservative separation inputs from the published finite proof and 54 display assemblies. Final display bounds include 51 poses and the .22 R1 stroke peak; `display-envelope-inputs.json` records their source identity. This does not widen contact admission.

Allowed interfaces are bounded same-fixture joints, the actual platform at the base bottom plane, and only the clipped <=20 mm terrain end of each thin outrigger. Natural mounts preserve 15 mm inward endpoints on real shoreline triangles. Each support is checked by actual ray or clipped surface contact, rather than merged-mesh bounds.

`joint/observation.json` records 14 map/quality scenes, zero unexplained collisions and 112 supported fixtures. `joint/sightline-observation.json` records 984 finite orthographic rays at desktop 1280×900 and compact 390×844: node centers, one numeral-corner proxy and classic extended start centers. These are geometric visibility probes, not full printed glyph or HUD coverage. Compact geometry is one rigid rotation of the same physical layout; it is not lower quality.

## Limits and remaining integration

The joint artifact deliberately excludes the newer coverage-foundation groups: Wild16/24 ground extensions and Boardwalk19's bridge/posts. Add those actual groups during integrated delta review. Twisty CarnivalDetails and printed/camera-facing overlays are also outside this mesh observation. Finite movement/standing/display envelopes do not certify continuous trajectories, arbitrary roles or new contact behavior. Old proof files and admission scope remain unchanged.

`lighting-budget.json` measures actual fixture triangles, batching and analytic Three r186 unoccluded illuminance at every route node. It does not measure whole-scene performance or real-device FPS. No WebGL/mobile pixel validation was available. Existing source-identity tests depending on changed scene inputs must remain pending until the integrated proof is linked; do not refresh hashes alone.

## Preview

`node --import tsx scripts/recovery/export-floodlight-row-preview.ts OUTPUT [environment-checkout]` exports exact current fixture/course/environment geometry for compact Mild and overall Boardwalks. Then `blender -b -t 6 --python scripts/recovery/render-floodlight-row-preview.py -- OUTPUT` renders them. Compact framing uses 390×844 CSS dimensions and 2× image resolution, preserving the camera's fixed UI-margin calculations. Canvas number/grain/lawn stamps, actors, mechanisms and HUD are omitted. Cycles illumination/tone mapping differs from Three; these are offline geometry previews, not game screenshots or WebGL acceptance.

`edge-mount-inputs.json` and `classic-mount-inputs.json` preserve the actual ray/curve measurements behind support coordinates. `export-floodlight-edge-mounts.ts` regenerates the natural reference input. Old failed draft audits are not shipped as passing evidence.
