# Final r1 support amendment

The original `../audit.json` remains byte-for-byte the 0a72 result. It checked r1 input `9d11128d…`, not the later center column. The current runtime manifest names this amendment and its SHA rather than pretending the earlier sample run included later geometry.

Run `node --import tsx scripts/recovery/audit-r1-support-delta.ts` from the repository root. This checks every unchanged baseline input, keeps the same 39 non-Punch devices and 24 exact banana Trip fixtures, and changes only the three declared inputs: r1 support factory, r1 mount manifest, and the original audit generator's explicit center-bottom argument. The generator is ready for a later full rerun, but the original large audit was not rerun or rewritten for this amendment.

The final r1 GLB, driver, four root matrices, park poses, full finite motion bounds, original plate vertices and original plate indices are unchanged. Wild23 has no added geometry. Wild24 adds exactly 24 vertices / 36 indices for one 160 mm square column from approximately y=.019 to .104. Its true triangles are tested against the full retained Wild scenery, route/pads/deck and five-light builder. Its column/plate contact is the exact upper plane. Terrain contact is restricted to the bottom 2 mm band, with no whole-pair exemption.

The real ground is not perfectly level: the column center and two inner corners touch y=.02 terrain, while two outer corners overhang the original slope by approximately 1.96 mm. This is an anchored center support, not a claim that its entire underside is flush. The exact five probes and triangle contact bounds are recorded.

The added column is conservatively disjoint from 12 original finite hardware/Trip envelopes and four recaptured exact standing-banana placements across the two orientations. Bounds are used only for exclusion. The park-only addon's separate complete static audit uses final r1 mount `d4b8bd52…` and support `58ba3529…` including the column. New r1 actor actions are the separate r1 worker's scope; no new actor, continuous-time or browser claim is made here.
