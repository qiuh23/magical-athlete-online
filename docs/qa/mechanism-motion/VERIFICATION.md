# Mechanism motion verification

## Verified

- All 151 character identities project the same confirmed, legal special-tile event at every one of the 54 special anchors: 8,154 comparisons. This deliberately does not bypass legitimate character immunity or invent an event that the engine would not produce.
- 1,728 actual mounted component cases: 54 anchors × 8 representative original character assets × desktop/compact × standard/economy. Assets: banana, coach, blimp, centaur, kraken, hotel, mounted hog-knight and were-form bite-mark.
- Original GLBs load without a fallback. Mesh world matrices or morph weights change. Each active anchor has exactly one real fixed-foot mesh at its world transform, counting idle instance batches as well as the active object. Pausing compares the current scene holder, verifies its identity is retained, and verifies its actual pose is frozen.
- Four eight-pawn same-cell checks use the actual private `Pawn` implementation from the current Board3D source. The script transpiles it in memory with a QA export only; it does not write runtime source or copy the pawn motion algorithm. Wild5/17/23/24 each include one already-down resident. Only the current target moves/falls; the other seven root/body poses remain unchanged. Authoritative racer data is unchanged. New beat keys replay from park, reduced motion parks the device, and the next normal beat restores motion.
- Sixteen lifecycle cases (8 scenarios × both quality tiers) replace the outlets Map, onReady callback, and both together while paused. The same live scene holder and pose remain intact. Old registries are cleared and new registries populated. Geometry/material/instance dispose signals and AnimationMixer stop/uncache calls total zero. The same model resumes movement afterward. The final 1,728-case and four crowded-Pawn runs were repeated against this lifecycle fix with source hashes checked both before and after.
- Separate representative run: 256 cases and 24 evaluated GLB frames rendered with offline Cycles. The attached fixed-camera contact sheet includes the 22-degree loss bell motion. The actors in these images are held at reference positions to isolate hardware motion; actual Pawn behavior is covered separately above.
- The new browser harness and its dedicated TypeScript project typecheck successfully. The structural fixture suite passes 3/3 tests.

## Not verified here

No browser page executed in this environment. The installed Chromium stopped before launch because its process-singleton socket was not permitted. The approved tool browser could not reach the local Vite server (`ERR_CONNECTION_REFUSED`). The images are offline renders, not browser screenshots. The no-op renderer does not test GPU drawing, frame rate, camera/UI behavior, complete room/network playback or all-character/all-state visual combinations. This evidence is not full-venue triangle-intersection or physical-contact certification.

`verification-summary.json` records counts and the source hashes used for the final evidence. The lifecycle-only revision produced exactly the same numerical pose records in all 1,728 combinations as the image-generation revision, so the offline images remain representative; their earlier source hashes are recorded separately.

## Reproduce

```sh
# All-roster event projection, real engine fixtures, existing down resident
node --import tsx --test tests/motion-qa-fixtures.test.ts

# All 54 anchors, representative real assets, both layouts/qualities,
# actual Pawn crowded cases, pause/replay/reduced-motion checks
node --import tsx scripts/recovery/verify-mechanism-motion.cjs /tmp/mechanism-motion-all54 --all

# Representative frames plus the same boundary checks
node --import tsx scripts/recovery/verify-mechanism-motion.cjs /tmp/mechanism-motion-images
blender -b --python scripts/recovery/render-mechanism-motion.py -- /tmp/mechanism-motion-images
python scripts/recovery/montage-mechanism-motion.py /tmp/mechanism-motion-images

# Browser QA, on an executor that can run Chromium
pnpm exec tsc -p qa/tsconfig.motion.json --noEmit
pnpm exec playwright test -c playwright.motion.config.ts
# Or inspect /qa/motion-proof.html?environment=1&mechanisms=1 on the local Vite server.
```

The existing `qa/mechanisms.tsx` is unchanged. The new harness resolves the actual engine arrival with `awaitRoll=false`; setting it to true would make `resolveTasks` stop after the initial move, before resolving the tile effect.
