# Mild infield review candidate

Local, unpublished follow-up to the segmented perimeter seating. Only Mild is changed. The request is to give its empty infield and pale entrance apron a credible purpose and improve the grass surface, without shrinking the route or removing the accepted trees/facilities. The design brief here is a summary of the requested change, not a verbatim quotation.

## Visual references and applied principles

- [Indianapolis Motor Speedway, official infield viewing-mound photograph](https://www.indianapolismotorspeedway.com/news-multimedia/news/2017/03/23/new-spectator-mound-to-provide-exciting-vantage-point-2017): spectators can occupy the interior of a circuit. A distinct service/access path separates viewing ground from the course. Applied here as a low infield bank and a continuous access walk, rather than another ring around the outside.
- [Hayward Field, University of Oregon official photographs](https://hayward.uoregon.edu/hayward-field-media-assets): the bowl image shows repeating seating blocks, side stairs and an uninterrupted concourse. Its field image shows grass as a quiet background around clearly defined event surfaces. Applied here as a small connected officials/medal precinct, seating side access and a restrained turf treatment. Images were inspected privately for reference, not copied into the game or redistributed.
- [TrackMania² Stadium, Nadeo/Ubisoft official store screenshots](https://store.steampowered.com/app/232910/Trackmania2_Stadium/): the selected multilayer-track screenshot separates the playable route, structural supports and enclosing venue with a limited material palette. Applied as a hierarchy principle only; neither the spectacular track geometry nor the crowded foreground is copied into this board game.
- [Scag, lawn-striping explanation](https://www.scag.com/pro-tip/lawn-striping-and-lawn-patterns/): mowing direction bends grass and changes its reflected appearance, rather than painting bright alternating colors. This informs the modest albedo variation and directional micro-normal. The web article was read; its downloadable image was unavailable and is not claimed as an inspected image.

## Actual changes

Mild gains one full-detail three-row infield bank at x=2, z=0, resting on a supported low plinth. Original seat and spectator geometry is instanced without scaling people or simplifying mobile content. The other maps retain their prior plans.

The service path connects officials, medal presentation, seating side entrances and a small rest bench before the final turn. Explicit tree wells and footing cutouts avoid burying trunks or colliding with existing gate/plinth geometry. The external entrance apron has a clear longitudinal aisle, paving joints, low benches and two low planted borders. No existing tree, podium, scoreboard, gate, route, node or lamp was moved.

The grass uses deterministic 512×128 color and normal inputs with soft mowing transitions, low-frequency variation and fine flecks. Pixel arrays are cached; full and economy views use the same input. No downloaded texture, grass-blade carpet, additional runtime dependency or asset service is added. The color and normal PNGs extracted from the offline GLB are exact matches to runtime pixels, with the required glTF normal green-channel conversion. An initial transparent-normal export was caught by this test and is superseded.

## Checks and budgets

- 37 focused seating/environment/turf/camera tests pass. Source/tests TypeScript and Worker TypeScript pass. Both local site builds pass; existing chunk-size warnings remain.
- `seating-static-audit.json`: seven map plans retain zero tested node/start-lineup/display-envelope intersections and zero finite number/pawn/corner occlusions in desktop and phone views. Mild has 24/24 seating support probes. These are finite static tests, not live-device acceptance.
- `infield-object-intersections.json`: actual triangles of seating, paving and forecourt items against existing tree meshes, facilities and frozen light geometry have zero surface, containment or uncertain intersections. No category-wide collision exemption was added.
- Mild seating/joinery: 143,688 triangles and 14 draws, compared with 97,440 and 14 previously. Increase: 46,248 triangles, zero additional draws. The original shared meshes remain unchanged. Texture memory is 512 KiB before mipmaps, about 683 KiB with mipmaps; no texture download bytes are added because pixels are generated locally.
- Camera stays at 390×844, zoom 23.294520075248535. Same route/pawn projection size, 0% zoom change. No day/night, caching, mechanism or action/follow-camera code changed.
- Combined release certificates were not rewritten. The four previously reported old identity-binding failures remain outside this bounded review. The full suite was not rerun for this follow-up; no all-tests or production acceptance is claimed.

## Offline deliverable limits

Two 192-sample Cycles views use the same frozen lamp geometry and the actual Mild DioramaStadium/stadium-v7 branch. The new turf pixels are included, not omitted. Editable .blend and .glb scenes are retained with the local review deliverables. Canvas tile lettering/grain, actors, HUD and mechanism hardware are absent. Lighting/material response remains a Blender approximation, not a WebGL screenshot or a performance result. Only Mild was rendered in this follow-up.

`export-seating-preview.ts` uses the executor's existing `@napi-rs/canvas` for offline export only. It is not an application dependency. Its canvas adapter shadows the native `data()` method so GLTFExporter does not misidentify a canvas as a raw DataTexture.
