# Native park-only fallback audit and portable layer

Supported (12): Punch Squiggle14, Boardwalks9/18/32/46/48/50/56, Wild7/11; native Trip Wild5 and Squiggle17. Blocked: Punch Wild16, with no terrain under three of five native-foot probes including center. No legacy Punch at Wild23/24.

All supported parks and new solid supports pass actual static triangle and closed-component containment checks against rebuilt full geometry, ground, full pads/deck, 22 environment models, five lights, retained approved devices/foundations, r1 Wild23/24 parks/foundations, and each other. All candidate bounds exclude the existing approved device-action, 24 banana Trip, and r1 action envelopes. No new physical-action/contact claim, no inherited certificates, no continuous-time claim, no actor grid or browser QA.

Punch foundations use the actual source fixed lower-slab footprint. Native Trip foundations use actual fixed foot bounds. Wild5 applies the unchanged authored foot adapter and default rotor pose; its support is inset 0.06 m from each x/z foot edge, producing a 1.18 × 0.68 m solid that avoids the grandstand ground-contact block. Squiggle17 allows only the actual deck column's bottom/foot-top planar joint at y≈0.40 within its bounded 0.24 × 0.25 m footprint, not a whole-object pair exemption. Terrain interfaces are restricted to the bottom 3 mm band.

## Integration

Import `ParkedFallbackLayer` and `clearParkedFallbackCache` from `src/client/scene/environment/parked-fallbacks/ParkedFallbackLayer.tsx`.

Props: `{ track, compact, lowQuality, racers, beat?, controller: SceneMechanismController, onFailure? }`. No playback, clocks, targets, score changes or physical-action callback. Existing event cues must remain rendered independently. A loading/error fallback is null. Two stable useGLTF calls load native Punch and Trip; matching clear helper clears exactly those two URL keys. Repeated Punch park meshes are instanced. Source geometry/materials are never disposed; owned supports and instances are cleaned up.

Visibility is recomputed every frame. Every non-eliminated actor must have a ready static geometry snapshot and finite positive actual radius. Each candidate is hidden for any actor sphere overlapping its audited bounds, using radius × actual occupancy scale × 2. All motion beats and custom mechanismSpacing hide candidates. Both hardware and its foundation hide together. Compact rotates the complete audited geometry and support rigidly by -π/2. Low-quality changes shadows only, never collision source geometry.

`geometry.ts` is shared directly by audit and runtime for source pose and foundation construction. `manifest.json` is generated from the audit's supported fixtures, contains exact mounts/support matrices/dimensions/envelopes and source SHA-256 identities, and explicitly sets physicalAction=false and contactCertificate=null. `park-fixtures.json` is the portable duplicate.

## Checks

Run `node --import tsx scripts/recovery/audit-parked-fallbacks.ts` to reproduce the 13 finite judgments and manifest. Final shared-factory run: 12 supported, one unsupported, no disallowed hits for supported fixtures. `node --import tsx --test tests/parked-scene-fallbacks.test.ts`: 5/5 passed (allowlist, fail-closed actors/motion/spacing, exact compact solids, source hashes, actual Punch morph rows and instanced matrix equivalence). Full `npx tsc --noEmit` passed; result is in typecheck.log. No publication, no runtime wiring, and no existing parent files changed.

Latest r1 dependency: center-column support SHA-256 `58ba352910257ae72f3443592823ade845303dece705520b45125915e88eddca`; mount-envelope SHA-256 `d4b8bd521a1e58ffde10ae15c4f2021db1dc6fb809b9d3ca02c5dcf52ec5507d`. Audit passes foundationCenterBottom and records support source identity. Actual Punch instancing allocates morph texture rows at full capacity before setting count=0; real-source regression covers its 14 meshes and one morph mesh.
