# Responsive DOM overlap check

Baseline: `d6ced096dba2695cb1adbfdac53e87c665e19e03`.

The official Sites preview served the real, unmodified Vite client build. A separate QA wrapper loaded that build in fixed-size iframes: 390×844, 844×390 and 320×667. These are actual responsive document viewports, not device emulation or WebGL verification. No application HTML was mocked, no browser security option changed, and no public service was modified.

## Scrollbar-width correction

At 320×667, `body { min-width: 320px }` forced a 320px document into a 305px content area when a 15px non-overlay vertical scrollbar was present. The page acquired an unnecessary horizontal scrollbar. The minimum now respects available content width with `min(320px, 100%)`; overflow is not hidden.

Before / after measured document clientWidth / scrollWidth:

- 320×667 home: 305 / 320 → 305 / 305.
- 320×667 practice configuration: 305 / 320 → 305 / 305.
- 390×844 home: 375 / 375, unchanged.
- 844×390 home: 829 / 829, unchanged.

Home entry controls, failed-connection retry, practice setup, rules tabs and character details were reachable at all three widths. Fully visible control centers had no unexpected hit-test interceptions. Long setup/rule content scrolls vertically. Modal bounds stayed inside each iframe: portrait rules 366×820 at (12,12), landscape rules 620×374 at (112,8), narrow rules 296×643 at (12,12).

The existing home-entry browser regression now compares scrollWidth to clientWidth (rather than innerWidth, which includes the scrollbar), and includes 320×667. Its full Playwright suite was not run in this environment. The actual responsive checks above used the official browser. TypeScript checks and the Vite client build passed.

Evidence delivered alongside this report: `static-mobile-metrics.json`, `fixed-mobile-metrics.json`, and before/after screenshots including `narrow-home-top.png`, `fixed-narrow-home.png`, and `fixed-narrow-practice-setup.png`.

## Verification boundary

The static client cannot start practice without its backend. This is an expected preview limitation, not an application logic failure. A separate QA launch adapter uses only the official daemon's supplied --host/--port to populate the unchanged compiled Node server's existing HOST/PORT contract. The normal tsx watch command could not open its incidental IPC pipe; it is not recorded as passing. The production server's frame-ancestors policy is preserved. Full race DOM is checked at the browser's available 1180×757, separately from the phone iframe checks. No 3D-rendering, route-choice projection, or normal WebGL-scene overlap pass is claimed.

## Graphics-failure UI correction

The unchanged Node server was reached through the official preview daemon using the QA argument adapter above. A real single-player practice room was created through the UI, four racers were selected, and Alchemist entered the race. No private fixture/state injection or public multiplayer was used. The actual browser document was 1180×757; candidate flags were `?environment=1&mechanisms=1`.

Before correction:

- Main `.scene-fallback` covered (0,0,1180,757) at z-index 35. It obscured the minimap at (908,20,252,205.39) and intercepted its 44×44 character-detail button at (929,163.39).
- Camera controls at (18,70,44,44) and (66,70,44,44) were obscured. The outer menu, roll and player list still worked.
- After a real roll and Skip, the board returned to `data-phase=idle` but retained two full-screen error layers. Both retry buttons occupied (544.56,395.5,90.88,40), and the second intercepted the first.

Correction:

- The main error remains visible below surviving 2D overlays, with only its retry button receiving pointer events. Retry has a 44px minimum height. The minimap and HUD are not hidden or replaced.
- Main renderer failure marks camera controls unavailable. No claim is made that the camera works without WebGL.
- The persistent dice renderer remains mounted in healthy operation. A failed dice boundary renders only its scoped active-presentation fallback; when inactive, or already covered by the main renderer error, it adds no second layer. No rule, dice value, transport, WebGL detection, CSP, or server setting changed.

After correction, the same real room was restored, retry was clicked, the minimap character-detail button opened its actual modal, and another roll followed by Skip advanced position 5→10 with the authoritative displayed die value 5. At idle there was exactly one `.scene-fallback`, zero `.dice-fallback`, and one main retry button. All fully visible control centers were unobstructed. Menu and chat were opened and dismissed again. Main retry, roll and minimap were usable throughout. Camera instead displayed “3D 镜头暂不可用”.

Focused Node tests cover main/scoped boundary output, asset recovery, race cues, presentation, choices and dice causality. TypeScript client/tests and worker checks and Vite client build passed. This is not a normal-WebGL render pass, full browser-suite pass, or phone race-layout pass. Route-choice projection and 3D labels still require separate geometry/render verification.

Evidence: `desktop-race-metrics.json`, `fixed-desktop-race-metrics.json`, `desktop-race-after-roll.png`, `fixed-desktop-race-idle.png`, `fixed-desktop-after-roll.png`, `fixed-desktop-minimap-detail.png`, and test/build logs. Preview was stopped after verification.

## Dice failure without Skip

A follow-up at `66edd32385c593311f044b9390d1a125ec7e0c1c` tested normal waiting rather than Skip. In a fresh UI-created Banana practice race, the authoritative event log reported die 6 and movement 0→6, but the presentation remained at `data-phase=dice`, displayed position 0, and disabled “演出中” at 24.4 and 41.6 seconds. No numeric confirmation button was present. The failed outer renderer boundary had unmounted DiceSpotlight's settled/read-time effects.

The correction adds a boundary around only DiceSpotlight's Canvas, leaving confirmed numeric output and the existing settled timer, `onSettled`, read duration and pause behavior mounted. Retry resets only the renderer through the existing scene retry key. It does not invent a dice result or bypass the presentation's completion rules. The outer boundary remains for unrelated component failures.

Actual official-browser retest at 1180×757, with WebGL still unavailable and no Skip clicks:

- First roll advanced position 6→7 and returned to idle automatically.
- Second roll showed the authority-confirmed 5 in the existing “点数确认” display, with `data-result-read-ms=1000`, then advanced position 7→12 and returned to idle within the 3.9-second observed action/check sequence.
- At idle, DiceSpotlight was hidden, the roll button was enabled, the minimap remained visible, and exactly one main retry layer remained. The compact dice-renderer error and its retry were confined to the active dice card.

Evidence: `no-skip-samples.json`, `no-skip-blocked.png`, `no-skip-confirmed-log.png`, `no-skip-fixed-samples.json`, `no-skip-fixed-rolling.png`, `no-skip-fixed-visible-face.png`, `no-skip-fixed-after.png`. The official preview was stopped afterward. The 76 focused Node tests, client/tests and worker TypeScript checks, and Vite build passed again. An explicit unavailable-WebGL no-Skip browser regression was added to `model-quality-recovery.spec.ts`; the full Playwright suite was not run here. This retest does not add a normal-WebGL or phone race-layout claim.
