# IvanPetrov astronaut — physical-iPhone trial

## Scope and asset

Bundled `assets/astronaut/astronaut.glb` is exactly 1,818,528 bytes (1.7343 MiB), SHA-256 `522c23ca1c75b63e55f44fc5cc185ddee6061bd33e453879f9e09a91cc60b46c`. It is byte-for-byte identical to the approved download, including its embedded CC BY 4.0 attribution. No mesh/texture optimization or repacking was performed.

Attribution: `assets/astronaut/ATTRIBUTION.md`. Visible credit and source/license links appear at the end of the existing Journey profile content. No redesign of Journey or its controls.

## Exact Metro change

After Expo's default configuration:

```js
config.resolver.assetExts = [
  ...new Set([...config.resolver.assetExts, 'glb']),
];
```

The existing native `three` resolution override is unchanged. No gltf/bin extensions, decoders, dependencies, or other Metro behavior added.

## Loading and resource ownership

`src/features/astronaut/load.ts` resolves the bundled module with Expo Asset, downloads it to Expo's local cache, reads exact bytes with existing Expo File System, and parses with the installed Three.js GLTFLoader. R3F's existing native adapter supplies its own embedded-image Blob/TextureLoader compatibility. No new global polyfills or monkey patches were added. A missing suit map/normal map is treated as a load failure rather than silently rendering untextured.

The web counterpart uses normal GLTFLoader URL loading. Each platform keeps a single module-level load promise. The initial cinematic mounts the asset boundary early, even when the returning-launch character is hidden, allowing the later universe to reuse the loaded source. Only the astronaut waits; star fields/camera timelines continue. There is no spinner or proxy swap. A late arrival fades in over 0.9 seconds (0.25 with Reduce Motion).

SkeletonUtils clones the skeleton per mounted scene instance. Geometry and texture objects remain shared; three materials are cloned once for each instance's fade/material state. The source is retained for reuse. Instance materials and skeleton textures are disposed on unmount, shared geometry/maps are not. Failure logs `[NEXT astronaut] Load failed; scene remains available:`; the empty character boundary leaves other controls and stars usable. Reload retries a failed module-level load. Physical-device texture upload is still an acceptance gate.

## Pose and appearance

The source has 43 joints, three skinned primitives and no animation clips. GLTFLoader sanitizes bone names (spaces become underscores); the pose references actual loaded names.

One-time stable pose:

- Asymmetric arms lowered away from the torso; elbows forward and gently bent.
- Slight leg separation; one knee bends more than the other.
- Feet relaxed forward/down; grouped fingers slightly curled.
- Head tilted subtly; existing whole-body yaw/roll prevents a frontal standing presentation.

No per-frame skeletal animation or unweighted mesh deformation. Posed height is normalized to 2.46 scene units and the original proxy's vertical center (-0.19), preserving the existing `.38` universe scale and cinematic discovery transforms.

All materials are single-sided. The visor is opaque, depth-writing, dark `#111924`, roughness 0.18, metalness 0.42, with no glow, transmission, environment map or new textures. It receives specular highlights from the scene lights. Suit and trim retain their existing maps/material values otherwise. Only during the brief load fade are the materials temporarily transparent.

## Placement, lighting and interaction

Replaced the proxy in ProductScene and CinematicScene. PersonalizationScene reuses CinematicScene, so its astronaut changes as well. Existing discovery/hold timing, camera path, scale, relative placement, First Contact behavior and returning-launch hide behavior remain intact. The old proxy file remains in the repository but is no longer referenced by these scenes.

Main universe retains its low ambient light (0.035). The warm point key is moved forward to `[HERO.x, HERO.y, 3.5]`, intensity 30, preserving the hero's screen direction while illuminating the visor-facing side. Cool directional rim is `[4,1,-4]`, intensity 0.65. This is an art-directed conceptual hero-star key, not a new star or a physically exact emissive-area-light simulation. Cinematic key color becomes warm `#ffe0b1`; discovery light ramps and cool rim remain intact. No shadow maps, HDRI or post-processing.

Existing slow vertical drift/yaw remain; added a tiny slow roll and eased object-level orientation response to profile selection/completion. The posed skeleton stays stable. Reduce Motion disables continuous object drift/roll/response; existing focus behavior is preserved. Canvas frameloop stops on background/inactive scenes, delta is capped on resume.

The existing 96×108 native projected profile hit target is unchanged. Tapping opens the same quieting/camera transition and dedicated Journey route. No mesh becomes an individual control; Journey adds no GL context.

## Performance estimate

- 10,808 triangles / 6,656 render vertices / 3 skinned primitives / 3 materials.
- Approximately three astronaut draws in steady state, versus ten meshes in the proxy, without shadow passes. Actual total-frame draw count has not been measured on iPhone.
- Two shared 1024×1024 JPEG textures: about 8 MiB RGBA base allocation, approximately 10.7 MiB including mipmaps. File compression size is not GPU memory. Drivers, source images, geometry and contexts add memory beyond this estimate.
- Skeleton skinning adds vertex work; no geometry simplification performed before trial.
- No new per-frame material clones or vectors in the astronaut component.

## Verification

Passed: TypeScript; `scripts/verify-astronaut.mjs`; existing `scripts/verify.cjs`; photo `scripts/verify-photos.cjs`; development iOS export including the GLB; web static export; `git diff --check`.

Astronaut checks cover unchanged file hash/embedded license, exact counts, real GLTFLoader geometry/rig parse, finite skin-deformed vertex positions, hands below shoulders, proxy-sized bounds, independent skeleton/material clones with shared geometry/maps, opaque visor, and the mocked native Asset/File/parse cache contract. Node texture decoding is stubbed in that test; actual decoding is checked in the browser.

Browser: real JPEG decoding/posed model under neutral lighting in an isolated viewer; correct first-contact astronaut render in the actual app; existing first-contact/question sequence; successful remote Gemini generation; astronaut tap reaches Journey; attribution visible. Remaining browser regression results are recorded below after final verification.

No claim of physical Expo Go loading, sustained FPS, thermal behavior, native permission prompts, or native background/resume acceptance is made. These require the user's iPhone.

Existing warnings: RN Web shadow/pointer-events deprecations; Three.Clock/CommonJS deprecations; NO_COLOR/FORCE_COLOR. Canvas disposal on route changes logs context loss; subsequent canvases rendered. No new loader/texture errors observed in browser inspection.

Photo functionality is unchanged from the previous pass and its mocked regression suite passes: optional selection/memory, original 2100ms submission, History photos, durable local storage, Reset cleanup. No image/backend upload was added. Dependencies, package-lock, app.json, Gemini client/server/model/prompt, task reducer, photo files, capsules and recap were not changed in this pass.

## Physical-iPhone test

1. Stop your current Metro with Ctrl+C. From the NEXT repository run:

   ```sh
   npx expo start --lan --clear
   ```

2. Reopen the refreshed project/QR in Expo Go on the same network. Keep the existing Gemini backend running. Do not reset real progress merely to test the model.
3. Returning launch: confirm no proxy flash or spinner, then see the real astronaut in the universe. Inspect visor, suit textures, silhouette and star-aligned lighting.
4. Tap YOUR IDENTITY/the astronaut target, observe subtle orientation and the existing camera/quieting transition. Confirm Journey, credit links, and return to universe.
5. Open Today and History. Drag each planet, close/reopen panels, orbit/pinch the main scene, and check that selection targets stay aligned.
6. Test BEGIN → COMPLETE → optional ADD PHOTO + written memory → SUBMIT → History. Verify the original animation, one completion, photo after reload, capsule creation and recap. Use only disposable data for Reset testing.
7. Open `exp://<Metro-LAN-address>:8081/--/dev/personalization` (or your displayed Metro port) to inspect isolated discovery without resetting production progress. `/dev/cinematic` also uses the real model. No scene timings changed.
8. Enable iOS Reduce Motion and replay; confirm no continuous character drift or abrupt travel. Background Expo Go for 10–20 seconds, return, and verify stable rendering/interactions.
9. Leave the universe running for several minutes and repeat interactions. Observe frame stability, heat and any texture corruption/context errors. Report any new physical-device error verbatim; compilation is not the acceptance test.

## Files

Modified: `metro.config.js`, `src/features/product/ProductScene.tsx`, `src/features/product/ProfileContents.tsx`, `src/features/dev/cinematic/CinematicScene.tsx`.

Added: `assets/astronaut/astronaut.glb`, `assets/astronaut/ATTRIBUTION.md`, `src/features/astronaut/Astronaut.tsx`, `src/features/astronaut/pose.ts`, `src/features/astronaut/load.ts`, `src/features/astronaut/load.web.ts`, `scripts/verify-astronaut.mjs`, this report.

Prior uncommitted work is preserved. No commit/push. Stop for physical-iPhone acceptance.
