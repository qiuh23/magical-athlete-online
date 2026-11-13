# All-character special-tile mechanism motion

Baseline: merged main `1e08851cfe60f156eec59ca25d706f71894e3c34`.

## Root cause and change

The rebuilt scene previously had three competing display/contact paths. The R1
entry simultaneously required `!environmentCandidate` and `sceneMechanisms`,
although `sceneMechanisms` requires the environment. Its physical driver could
therefore never become available. Other physical paths admitted a finite set of
previously checked character/pose/map combinations. The full-coverage fallback
kept the hardware visible but used small motions, while independent cues still
rendered particles. This made successful tile events look like stationary props.

The rebuilt scene now has one hardware owner: `FullCoverageMechanismLayer`.
Every legal event uses the same animation path regardless of character identity,
form, mount, occupancy, layout or quality. Existing rule immunities still apply:
an event which the engine does not emit is not invented by this visual layer.

The seven authored model variants use complete joint cycles: telescope/extend
and retract the punch, rotate and telescope the trip arm, raise and lower the
gain arms, swing the loss bell, and open/close warp doors. Foundations remain
fixed. Joint poses are absolute, repeatable and return exactly to park, rather
than accumulating rotations across frames. Low quality keeps the same motion.
The explicit reduced-motion setting parks mechanical animation. Pause freezes
the mounted pose; a new event key can replay the complete cycle.

## Contact and timing boundaries

These are deliberately outboard, non-contact mechanical cycles. They do not
enable the old finite contact certificates at relocated display mounts and do
not claim universal physical collision. Punch feedback originates at the actual
evaluated glove release surface and targets the current visible character bounds,
including size, orientation, crowd scale, mount, form, skin deformation and down
pose. Those bounds guide visual feedback only, not authoritative movement or
collision decisions. This is a safe complete-motion fallback for general shapes.

The authoritative path, special-tile rules, turn order, presentation duration,
paint-before-advance barrier and delayed trip fall remain unchanged. The old
environment-opt-out contact implementation is not broadened by this patch.

Loading is independent by model category. A temporary loading silhouette is not
reported as a loaded original model. All loaded categories must finish before
the rebuilt layer reports ready. There is no second R1 or revalidated layer at
the same anchor. Replacing callback/feedback registries does not dispose a
still-mounted kit.

## Evidence and limits

See [VERIFICATION.md](VERIFICATION.md) and
[verification-summary.json](verification-summary.json) for the repeatable
component, actual-Pawn and roster coverage. The two JPGs are clearly labelled
offline evaluated-model renders, not browser gameplay screenshots.

`reviewer-coarse-bounds.json` records finite AABB checks against other devices
and sampled static character meshes. It is not a full-venue collision certificate.
The four source copies in `historical-main-1e08851/` preserve the exact input
hashes of earlier finite evidence. Tests verify those historical reports without
pretending they certify the changed runtime. Their retired contact consumers
must remain absent from the rebuilt Board3D scene.

No server, shared rule, public art, dependency, deployment configuration or
production asset file is changed. Browser GPU drawing, gameplay camera/UI,
network playback, performance and all possible dynamic collisions still require
an executor that can run the committed browser harness. No remote repository
write or deployment is part of this local delivery.
