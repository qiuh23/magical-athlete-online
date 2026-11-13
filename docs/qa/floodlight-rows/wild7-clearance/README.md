# Wild light7 foundation clearance

Only Wild's front-row rightmost fixture moves 0.25 m farther outward, to Z6.025. Its entire head/pole/base/plinth moves coherently, aim is recomputed, and its low connecting beam extends to the new pedestal. The real Wild16 ground extension ends at Z5.475; the pedestal now begins at Z5.525, leaving about 50 mm separation. Other maps, lights, camera and preview images are unchanged.

The new regression test loads actual Wild16 GLB/support geometry. It reproduces both old triangle collisions at Z5.775 and proves their removal in both qualities. The extension/foot dimensions are not reduced or exempted. The beam remains below both parts.

Reproduce from the integrated repository root:

- `node --import tsx --test tests/wild-floodlight-clearance.test.ts tests/rebuilt-floodlights.test.ts tests/automatic-scene-lighting.test.ts` (16 passed)
- `MAPS=wild node --import tsx scripts/recovery/audit-floodlight-row-joints.ts . . docs/qa/floodlight-rows/wild7-clearance` (2 scenes, 16 support attachments, no unexplained lamp collisions or protected-envelope overlaps)
- `MAPS=wild node --import tsx scripts/recovery/audit-floodlight-row-sightlines.ts . docs/qa/floodlight-rows/wild7-clearance` (124 finite rays, zero blockers)
- `MAPS=wild node --import tsx scripts/recovery/audit-integrated-venue-foundations.ts` (integrated audit owned separately; its protocol/source identities and lamp-specific observations are retained in foundation-delta.json)

Release and worker TypeScript checks passed. The existing classic-mount source-identity test is pending because the integrated Mild turf change alters DioramaStadium.tsx; that unrelated evidence was not rehashed here. The integrated foundation audit still reports three Wild13/seating collisions per quality and a retained-domain conflict, outside this repair. This is not a whole-scene pass or a new physical-contact authorization. No browser/FPS/render work was repeated.
