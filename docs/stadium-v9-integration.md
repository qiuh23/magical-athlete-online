# Stadium V9 integration

2026-11-12. Based on main `8bd9cab26582cc3beeae3bc8dc61e0d3055f3bfb` and the supplied V9 Blender package. This is an integration, not a new asset export. The `.blend` sources and reference PNGs are deliberately not runtime dependencies.

## Scope

- Ship the 19 approved GLBs, unchanged, under `public/models/stadium-v7/` (2,322,148 bytes in total). The supplied manifest retains checksums, dimensions and PBR values.
- Classic `mild`/`wild` boards use the four-zone infield, props, live-rule-selected tile surfaces and existing compact rotation. Other topologies and Carnival/Whirly models are not replaced by this layout.
- Preserve original characters, board/pawn coordinates, numbered/special Canvas overlays, reversed endpoints, camera and rule timing. Negative-arrow tiles own their purple material clone; triggered tiles own their emission state. Model caches are not disposed by an instance.
- Repeated decoration is instanced per asset primitive. Economy quality and failed asset loads use the existing procedural contents. Low quality does not request stadium models on first entry, does not create PMREM and does not enable real-time shadows.
- Scoreboard and bunting exist only in overview with no intro or target/route choice. The original DOM score display is untouched. Gate labels remain live Canvas text.
- Replace the old light component with the supplied `StudioLightingV7` and V9 sky. Default is fixed **day**; an optional `Board3D.appearanceMode` prop supports day/dusk/night without a new menu, client clock, protocol or server state. Night is intentionally readable artistic moonlight. No stadium lamps are enabled.
- Explicit `starMode: 'diorama'` gives the orthographic background visible tiered stars. This is an artistic star backdrop, not astronomical positions. Sun/moon and main light retain the same world-space directions. No camera alignment or new animation loop is installed.
- The classic board's old 240×240 background floor is reduced to its existing board footprint so it cannot hide the sky. The plinth, deck, course and contact shadow remain. Nonclassic floors are unchanged.
- Renderer geometry/texture/program counts are added to existing diagnostic data attributes. There is still a single Canvas and the original demand/active frame policy.

## Executed checks

- Frozen `pnpm 11.25.0` install on Node 24.22.1: passed, with cache/data directories inside the workspace. No lockfile or dependency upgrades.
- `pnpm typecheck` and `pnpm typecheck:release`: passed.
- `node --import tsx --test tests/3d-assets.test.ts tests/scene-math.test.ts`: 12 passed.
- `node --import tsx --test tests/stadium-v9.test.ts`: 5 passed. Real GLTFLoader decode of all 19 GLBs; exact SHA/PBR/dimensions; rule selection; tile/start/compact anchoring; per-instance material ownership; deterministic sky mode/quality/disposal.
- Full `node --import tsx --test tests/*.test.ts tests/host.test.mjs`: 1,507 passed, zero failures. Run after the build, not concurrently: the dual build temporarily rewrites the development registry to CN before restoring global, which made one earlier concurrent validation attempt fail the registry contract. The final sequential run passed. This is the same test selection as `pnpm test`. The tsx CLI wrapper itself could not create its Unix IPC socket in this environment, so the supported Node import hook was used without changing the test files or assertions.
- `pnpm build`, `pnpm build:browser`: passed. Existing large-chunk warnings remain. Both output directories include all 19 GLBs.
- `pnpm exec wrangler deploy --dry-run` with a workspace-local config/cache directory: passed. No manual deployment was performed.

## Browser verification remains blocked

Chromium aborted before loading a page: `process_singleton_posix.cc: socket() failed: Operation not permitted`. A temporary profile and an authorized elevated attempt produced the same result. The available external browser could not reach this execution workspace's local preview.

The new `tests/browser/stadium-v9.spec.ts` uses a test-only fixture mounting the real Board3D under React StrictMode. It covers desktop/390px, explicit modes, eight occupants, reversed endpoints, high/low cycling, idle demand frames, remounts and GLB failure fallback. It was attempted, but all three cases stopped at browser startup. Run it on a browser-capable machine:

```sh
pnpm exec playwright install chromium
pnpm exec playwright test tests/browser/stadium-v9.spec.ts
pnpm exec playwright test tests/browser/three-scene.spec.ts
```

No baseline/after screenshots, real draw-call/frame-time comparison, GPU leak conclusions, mobile FPS or all-angle occlusion approval are claimed. The fixture exposes renderer counts and saves actual screenshots when run; they are not substitutes for a real phone test. Intro/target selection, repeated reconnect/enter/exit and renderer quality behavior still require browser review before this draft is marked ready.

## Delivery boundary

No gameplay, network protocol, identity, site-edition policy, deployment workflow, credentials or domains were changed. The authorized draft PR follows the repository's existing `Checks → Deploy checked backends` path; it may produce a shared preview when checks succeed. This work does not merge the PR, trigger manual deployments, or assert either public site has updated. CI and preview status must be read for the exact remote commit.
