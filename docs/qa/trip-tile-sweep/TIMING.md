# Shared mechanism timing

Baseline: `2690d066e055146f12a6d808d42e074eac04a9fa` (PR #69).

`beatDuration()` adds a 1.25 duration factor only to confirmed fixed-tile
mechanism events. An ordinary 1,600 ms mechanism cycle therefore becomes
2,000 ms, a 20% reduction in movement speed. It adds no independent delay.
The factor is applied after queue pacing, so it cannot push the unstarted queue
over the 12/24-second compression thresholds or change unrelated actions.

The existing speed control and 1,000 ms fast-mode minimum remain in effect.
Reduced-motion durations and parked hardware remain unchanged. Ordinary
movement, character skills, recovery and other non-mechanism events retain
their previous timing.

The resolved duration and the same `PresentationClock` flow through the
mechanism rig, pawn movement and fall, event cues, transient effects, minimap
and presentation completion. Per-target sweep contact time determines the
start of the target's fall and hit marker. No separate timeout decides when
the next turn may appear. The existing terminal-render/paint barrier still
owns that handoff; skip and reconnect discard queued presentation normally.

Original sculpture clips previously had a second clock: `mixer.update(delta)`.
For mechanism targets, `ToyPresentationPlayback` now samples these clips from
the shared absolute phase, including late remounts, pause, repeat keys and
quality changes. A skill clip spans the beat. A movement clip follows the same
route progress and step count as its pawn, so it does not run before a punch
launch or continue through the return window. Mounts receive the same clock.
The ordinary non-mechanism animation path still uses its previous local delta.
Trip sculpture clips remain disabled because the sweep-driven whole-body
fall owns that reaction. The shared-clock implementation lives in the separate
`MechanismToyCharacter.tsx` component. The original `ToyCharacter.tsx` is byte-for-byte
unchanged from the baseline and still owns ordinary and historical physical-contact
paths; historical certification evidence is not rewritten to cover this new adapter.

Relevant tests:

- `tests/mechanism-slowdown-sync.test.ts`: five speed settings, reduced motion,
  all mechanism types, unchanged ordinary actions and queue thresholds,
  shared progress/completion, pause, skip, reconnect and final paint.
- `tests/toy-presentation-sync.test.ts`: nine real GLB assets, skin vertices,
  movement gating, absolute phase, repeat, pause and quality remount.
- `tests/mechanism-playback-sync.test.ts`: pause at first sample, quality remount,
  shared-clock phase, speed/reduced changes, and legacy wall-clock pause handling.
- `tests/trip-sweep-layout.test.ts`: geometry layout frozen for one track-trip beat,
  scope changes, next beat, and real crowded desktop/compact pawn coordinates.
- `tests/mechanism-animation-timing.test.ts`: target fall phases, existing down
  residents and terminal handoff. Geometric sweep contact is checked separately.

These timing tests are not a browser performance benchmark. Ambient stadium
lighting/pulsing does not control contact or action completion and is not
globally slowed by this patch.
