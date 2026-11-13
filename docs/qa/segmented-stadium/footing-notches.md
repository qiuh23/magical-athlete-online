# Local platform clearances

## Scope

This separate follow-up to the accepted Mild infield/turf work changes only low platform cream surfaces and bronze nosings at Squiggle 21/28/29, Whirly World 12 and Wild 13. Boardwalk 21 did not collide with seating; its separate display-seat conflict belongs to the coverage patch. Mild is not redesigned or re-rendered.

The cutouts follow each unchanged physical/display foundation, with a 15 mm construction joint. Wild 13 also includes its older ground tongue. Original curved source surfaces are clipped, and cut faces are closed; bounding boxes are used only for early exclusion. Both foundations and all route/device roots and datums stay unchanged. Lower wood/stone structural layers, seat/crowd meshes, rostrums and railings stay unchanged. There are no collision exemptions or manifest edits.

The helper handles overlapping cuts as a surface union, removes internal clipping caps and reconciles cut-edge subdivisions. Tests require closed components and exercise containment, not only triangle crossing.

## Finite checks

- 41 focused seating, clearance, turf, environment and camera tests pass.
- Source/tests TypeScript and Worker TypeScript pass. Both local builds pass, with the existing chunk-size warnings.
- `footing-clearance.json`: actual old physical supports and current display supports at the five affected anchors have zero seating intersections in both quality settings. All 112 sampled under-bank contacts pass. Every joinery component remains closed.
- `seating-static-audit.json`: seven plans retain zero tested node/start-lineup/display-union intersections and zero finite number/pawn/corner ray obstructions in desktop and portrait views. Source binding includes the new clearance helper.
- `footing-passage.json`: Mild, Twisty, Boardwalks and Bridges seating geometry and instance matrix bytes match the integration baseline. Squiggle's existing 1.2 m access tongue remains connected after the notch. Its narrowest sampled clear cream strip is 0.61 m. This is a **narrow pedestrian connection**, not a broad entrance or an accessibility-compliance claim. No widening is included in this bounded patch.

## Geometry budget

No mesh draw calls, asset downloads, dependencies or textures are added. All content remains identical between full and economy settings.

| Map | Added triangles | Cream volume removed | Fraction of cream volume |
| --- | ---: | ---: | ---: |
| Squiggle | 3,092 | 0.82314 m³ | 2.02% |
| Whirly World | 1,568 | 0.32526 m³ | 0.63% |
| Wild | 1,926 | 0.38852 m³ | 0.75% |

Only the active map is instantiated. Added vertex buffer data is at most about 290 KiB (position, normal and UV), before renderer overhead. Remaining construction volumes are preserved. The fixed foot fills most of each notch; it is not an empty missing platform.

## Local visual observation and limits

The five local details use exported runtime meshes in Blender. They isolate low walking surfaces, nosings and foundations with an unlit material view. Terrain, upper stands, actors, HUD and device cabinets are hidden deliberately to expose the joints. They are construction details, not complete gameplay screenshots or night-lighting acceptance. GLBs, the five PNGs and the combined detail panel are retained in the local `stadium-platform-notches-20261113` artifact directory; the export and render scripts are checked in.

This is a bounded seating/support delta check against the integration support source recorded in the JSON. The final integration must rerun the combined-world audit after merging the coverage and lighting changes. It does not replace physical action/actor contact certificates, continuous-time collision proof, live WebGL/mobile testing or FPS measurements. The full test suite was not rerun here, and old source-identity certificates were not rewritten to make them pass.
