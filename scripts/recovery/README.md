# Environment v2 source-derived asset rebuild

This is a **new version**, not the recovered bytes or certificate of the missing historical tested tree. Inputs are the verified refined natural scenes and joint U scenes in the two source packages. The package identities, member SHA256s, script SHA256s, output SHA256s and Git blob hashes are recorded in `public/models/environment-rebuilt-v2/asset-manifest.json`.

No upload, remote modification, commit, merge or deployment is performed by these scripts. There are no replacement floodlights: the five missing `fl_*` templates are still absent.

## Reproduce locally

Prerequisites: Blender 4.3.2, Python with NumPy/SciPy, repository Node dependencies, and the verified source directory materialized beside the checkout as `../materialized-sources`.

Run sequentially, because the independent validator completes the measured asset manifest:

```sh
blender -b -t 2 --python scripts/recovery/export_environment_v2.py -- --source-root ../materialized-sources
python scripts/recovery/validate_environment_v2.py
node scripts/recovery/validate_environment_v2.mjs
blender -b -t 2 --python scripts/recovery/reopen_environment_v2.py
```

Export evidence snapshots and isolated renders are written to `../environment-rebuilt-v2-evidence`, outside the runtime package. The raw sources are never saved or modified. Re-exported landscape bytes are copied unchanged from the previously verified **new** `reexport_v1` files, not recreated from historic Git identities.

## Runtime deliverables and space contracts

- Three tree GLBs: `tree_elm_rebuilt_lod2`, `tree_maple_rebuilt_lod2`, `tree_sapling_rebuilt_lod2`. No LOD0 or LOD1 GLBs are included.
- Seven root-local facility/gate GLBs: `bleachers`, `spectators`, `podium`, `officials_kiosk`, `scoreboard`, `start_gate`, `finish_gate`. Children are transformed by `inverse(root.matrix_world) * child.matrix_world`; the removed root matrix is retained in the manifest.
- Three source-world support GLBs: `grandstand_rostrum`, `official_rostrum`, `podium_plinth`. Geometry retains original world placement and height; nodes are identity. No extra +1.43 is applied.
- Nine natural layers: `{squiggle,boardwalks,bridges}_{base,furniture,landscape_reexport_v1}`. Actual source geometry and PBR are retained, world placement is baked into vertices, and no props are rearranged or stretched.
- `src/client/scene/environment/source-layout.json` contains only seven track entries. Each has `trees` and `pockets`. Tree `asset` is a filename stem, `matrix` is a nested four-row Y-up matrix, and `sourceScale` is 1.
- Coordinate conversion is `C * M * inverse(C)`, where `C(x,y,z)=(x,z,-y)`. Original scale, yaw, names and height are retained. There is no mechanismsScale, +0.7 or occlusion adjustment in the source layout.
- U maps select only `INFIELD_TREE_*`: six source instances per map. Seven old outer `GROVE_tree_*` instances are explicitly excluded. Natural maps retain all 14/10/27 instances. Wild explicitly derives the six mild positions because its standalone grove source was not recovered. Separate `source-layout.metadata.json` records selection and provenance.
- Pocket values are copied exactly from the real `map_source.json` at source commit `b3e35290674379279a7ce4f2043d80ae1c3af2cc`, rather than re-estimated from screenshots.

## Measured mobile tree trade-off

Original bark and leaf geometry is decimated separately at 0.30, then surviving face colors are baked to float corner vertex colors. All three trees are opaque, texture-free, and have exactly two primitives/materials. Hard palette boundaries remain exact. Leaf roughness stays 0.77; bark uses the documented new 0.90 approximation of the source's 0.88/0.90/0.91 values. This is not a claim that the lost two-material implementation was recovered.

| Asset | GLB bytes | Actual triangles | Primitives |
|---|---:|---:|---:|
| Elm LOD2 | 334,352 | 3,927 | 2 |
| Maple LOD2 | 353,572 | 3,924 | 2 |
| Sapling LOD2 | 189,424 | 2,224 | 2 |

The largest coordinate change in the six bounding-box extrema is 0.066193 / 0.078080 / 0.045226 units respectively. No runtime acceptance follows from those measurements. The complete 22-asset package is 4,380,220 GLB bytes, 93,971 summed triangles and 94 summed primitives. These totals count each file once; they are **not** a per-scene rendering budget or draw-call/FPS result.

## Verification and failed approaches

- Independent GLB decoding verifies headers, identity nodes, finite positions and unit normals, material-group triangle counts, bidirectional per-triangle geometry, PBR, exact surviving source color palette, alpha, no images and no external resources. Geometry error is below 2e-5 units; actual maximum is 3.8433e-6. Vertex color error is 0. Layout matrices compare exactly to the prior independent source inspection, and pockets match the source JSON.
- Three GLTFLoader imports all 22 files and checks triangle counts, bounds, primitive counts, two-material vertex colors and opacity.
- Fresh Blender imports independently recheck geometry and dependencies. Source-vs-LOD2 and gate front/rear renders are isolated asset QA, not game WebGL or mobile performance validation.
- The initial independent test correctly failed on the three bark material groups. After decimation, Blender's glTF exporter silently repaired invalid duplicate faces, reducing counts by 6/6/5. The fix explicitly calls `mesh.validate` before taking the export snapshot and counts. Tolerances and material-group assertions were not weakened. The observed failure text and count diagnosis are archived in `../environment-rebuilt-v2-evidence/initial-validation-failure-from-tool-output.txt`; it is explicitly labeled a tool-output transcript, not the original log byte stream.
- Initial rendering failed because this Blender build has no OpenImageDenoise. The render script uses 48 samples with denoising disabled. An earlier reopen run overlapped regeneration and read the manifest before independent validation had added its measured bounds; the documented sequence prevents that race.

No historical runtime, mechanism-combination, collision, FPS, shadow or screenshot certificates are inherited. Those checks belong to the final integrated layout.
