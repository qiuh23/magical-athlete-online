# Visible stadium floodlight cores

Historical development notes imported with the lighting implementation. The final runtime uses 8/4 spots and 2/0 local shadow maps (full/economy), with full-quality target irradiance .64. Earlier budgets below describe intermediate versions. Current integration and freshly run checks: [incremental extraction](../athlete-release/incremental-preload-lighting-timing.md).

Local continuation of integrated stadium revision 3b14051. Nothing published.

- Eight fixtures retain their verified mounts and targets. New scattering cores use those exact receivers and target axes.
- One merged transparent draw, 3,072 triangles, one shader/material, no textures, no additional real lights, shadows, postprocessing, timers, or render requests. Both quality choices retain the full visual effect. Existing real spot budgets remain 6/4 and shadow budgets 1/0.
- Soft silhouette, gradual near-source fade and broad axial fade keep the cones from looking like opaque triangles. Depth testing prevents foreground opaque geometry from being painted over. This is an inexpensive surface approximation of haze, not physically volumetric light or shadowed fog.
- The existing night factor controls lenses, spot intensity, and beam visibility. Fully off in daylight; cleanup disposes owned GPU resources. Unready fixtures retain original moon/ambient illumination.
- Only ready-fixture nighttime illumination changes: main directional contribution .65 -> .35, hemisphere .30 -> .22, fill .20 -> .13. Real spot receiver energy is unchanged, preserving audited route coverage and number readability.

Preview exporter uses actual runtime environment, fixture, deck/pad geometries and camera, with the scattering mesh and matching falloff approximated in Cycles. Renderer is offline, not WebGL or a phone FPS acceptance. It omits runtime canvas labels, HUD, pawns and dynamic rigs. No performance claim on physical devices is made.

## White stadium-light refinement

Following user feedback, preserve the accepted illumination intensity and ground contrast. All lamp lenses, real spotlights and scattering cores now share neutral/cool white #f2f6ff. Narrow the core end radius from 2.35 to .95 scene units and preserve a clearer straight axis to .82 of its length before tapering. No new lights, shadows or animation work.

Ground, turf and course in DioramaStadium are standard PBR materials and receive the daytime sun or nighttime spot illumination. Their authored surface colors/textures are not repainted per phase; lighting changes the displayed color. Labels and signs may retain unlit readability layers. A source regression test protects the main ground/turf materials and shared lamp color. Same-camera day/night offline exports use the corresponding source light presets, day lamps off and night lamps on. Cycles sky fill/tone mapping and omitted canvas textures differ from live WebGL; this is not a phone rendering acceptance.

## Local pool correction

The earlier narrow haze cones still used the historical very-wide physical spot profile (1.18-radian half-angle), creating excessive overlap. The current runtime and preview now both call venuePoolPhotometry: .57-radian half-angle, .42 penumbra, quadratic distance attenuation, cutoff 1.65 times the central receiver distance, and .82 target receiver irradiance (1.05 economy). The light mounts and optical axes are unchanged. Existing historical photometry remains intact as historical evidence; it is no longer a statement of current local-pool coverage.

Ready-fixture night background is reduced to ambient .03, hemisphere .14, main .18, fill .08 and environment .055; daylight and missing-fixture fallback are unchanged. Intentional darker track sections receive the cool background, rather than being forced to overlap multiple direct pools. Main track pads, labels and gameplay remain present; physical-phone readability and performance have not been measured. See pool-photometry.json for current unoccluded direct-light samples on all seven maps in both quality modes.

The offline image uses the same spot position, angle, cutoff-calibrated central intensity, penumbra parameter and white color. Cycles finite cutoff, penumbra interpolation, sky fill, material textures and color mapping are not identical to Three/WebGL. Therefore the image verifies the intended local-pool composition, not pixel parity with production. No permanent geometry or historical certificate was changed.

## Spreading beam / both-side lamp correction

The visible scattering shell now derives its spread from the actual pool cone's bright interior (angle × (1 − penumbra × .7)); its soft edge represents the dim penumbra rather than drawing an opaque outer boundary. The visible cone extends to its central receiver cross-section; depth testing occludes parts behind the receiving surface. Its radius derives from the actual bright-interior angle and lamp-to-field distance instead of ending at a fixed .95 radius. A soft longitudinal fade terminates the scattering without adding a luminous cap. This bounded presentation avoids the excessive fog produced by extending every grazing edge ray to the far ground intersection. This remains a lightweight scattering approximation, not volume ray marching.

Investigation confirmed that the historical full-quality budget deliberately omitted one physical spotlight on each side, although all eight lenses emitted. Default full quality now enables all eight true spots, four per side; target receiver energy per spot is .64 instead of .82 to compensate for overlap. The accepted .57 angle, .42 soft-edge parameter, finite range and background settings stay unchanged. One local shadow remains. Explicit economy remains four spots/no local shadows, with all fixture hardware retained. This adds two unshadowed lights in full quality; physical-phone frame rate has not been measured and must not be described as unchanged. A test enumerates all four active lamps on each side and verifies positive power and agreement with their actual optical axes.

The dark housing backs may still appear dark from the overview camera: the luminous faces point toward the track. We did not repaint opaque housings as emissive white or change physical mounting geometry to fake lamp activation.
