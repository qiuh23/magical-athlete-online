# Incremental lighting, preload and mechanism presentation fixes

Extracted on 2026-11-13 against origin/main `1a97995d1f3bd33ba5a9bdb518630e38ca015ef2` (PR #67).

The supplied complete patch reconstructs tree `cb17d9d27becaddd70e814b3d1bb3a0de292001d` from its declared base `0443c8f256cc06b2955bf213791a7cfe08ff8062`. Only the remaining scoped changes relative to current main are included. Documents in the archive are provenance, not instructions or new validation results.

## Included

- White floodlights, bounded visible beams, softer local pools and darker inter-pool fill. Full quality uses eight fixed-source spots and two reusable shadow maps; economy uses four spots and no local shadow maps. Compact shadow maps are 512×512; desktop maps are 1024×1024. Viewed racers and the viewport ground center select which existing lamps receive the two shadow slots.
- Idle preloading for the current frozen round plan during draft and actual track during selection. Exact Drei cache groups match visible consumers. Save-data/2G opt out; map, room, quality or phase changes cancel queued work. No hidden scene or all-map/all-character preload.
- Mechanism reaction windows, delayed displayed trip falls, and cancellable completion after a terminal render/paint opportunity. Pause, skip, reconnect and reduced-motion behavior are covered by regressions.
- Relevant tests, offline lighting calibration/export helpers and scoped integration identity updates. Fourteen existing finite geometry reports change only their Board3D input identity; their measurements are historical, not newly rerun geometry evidence. The identity-link file updates the corresponding hashes.

## Preserved main content

No scene geometry, fixture placement, model assets, game rules, server protocol, lobby/quality UI or deployment workflow is changed. Already merged stadium and mechanism-layout work is not reapplied. Main's removal of the repository-wide source manifest, freeze generator and hash-lock test is preserved. Main's release README and stadium-upgrade notes are retained, with the current light budget corrected in the README.

## Validation

- Full local unit/integration suite: 1701/1701 passed, zero failures/skips.
- Full TypeScript source/test check and Worker typecheck passed; source/test check also passed after adding the offline helpers.
- Domestic client/server and overseas browser builds passed (existing large-chunk advisories remain).
- All-seven-map/two-quality analytic pool calibration regenerated from this checkout; this measures unoccluded irradiance, not rendered pixels.
- Initial run: 1699/1701 passed. One failure exposed an omitted preview helper, now included; the other used macOS's older Python without tarfile's data filter. Both passed on focused rerun (13/13) using the bundled Python, with no deployment-code change.

No new browser gameplay, real-phone FPS, weak-network timing or visual shadow acceptance was performed. The new two-shadow budget can add GPU work. Historical offline previews are not live WebGL evidence.
