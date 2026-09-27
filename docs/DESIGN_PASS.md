# NEXT — deadline design pass

## Implemented flow

Every cold app launch / JavaScript reload starts with black → NEXT → slogan → independent point → spatial travel. The entrance-complete flag is session-only. Briefly backgrounding and foregrounding the same running app does not replay the entrance.

First-time flow: opening → decelerating field → local identity → form fades away → the same cinematic clock resumes into astronaut discovery → first reflection and consequence → remaining personalization → existing Gemini/fallback generation → universe.

Returning flow: opening → travel → early arrival fade → restored universe. Completed users do not repeat setup or personalization. Interrupted personalization resumes at its first unanswered question after the entrance. Development controls support replay while keeping progress, and a separately confirmed full local reset.

## Local profile and persistence

- New persisted fields: `username` and `profileCreated`.
- Username is trimmed, 2–24 characters, starts with a Unicode letter/number, and permits letters, numbers, spaces, periods, underscores and hyphens.
- No password field, credential, password hash, remote account or authentication service is introduced. No password is collected or persisted.
- Existing state remains: personalization answers, begun/entered/first-consequence/onboarding flags, first NEXT summary, current NEXT and completed history. Task IDs, source, status and timestamps remain in the existing records.
- Existing version-1 two-slot persistence/revisions remain. Completed pre-profile saves migrate to `Traveler` with `profileCreated: true`, preserving answers/tasks/history. Profile name can be edited locally.
- Session entrance, camera position, selected panel and transient completion light are not persisted. Persistent stellar energy is derived from history count and current task status.
- This is local demo identity, not secure authentication or cloud synchronization.

## Universe and interaction

One active Canvas contains a warm-white procedural hero star, a dark Today world, a quieter History world, the temporary astronaut/profile anchor, and 900 depth-varied background stars. Resting space has no travel trails. Generous projected native touch targets follow the bodies.

The hero uses a low-cost procedural surface shader and a small additive radial halo with irregular corona. No post-processing, shadow maps, textures or physics were added. Completed NEXTs increase its size/energy up to a restrained visual cap; active tasks add a smaller energy increase.

Today, History and Profile ease the camera toward their objects and quiet the surrounding field. Native text remains readable below the focused object. Today reveals title, action, rationale/time and actions in that order using staggered opacity/depth transitions. History retains the reliable native list; up to 32 small circular remnants represent accumulation (all history records remain stored).

Tapping the astronaut focuses the existing TEMPORARY proxy and reveals username, progress vision, daily commitment, completed count and current NEXT status. The proxy remains replaceable and is not a new permanent astronaut design.

Completion saves through the existing reducer immediately, fades the task text, sends a small light from Today to the hero, adds persistent energy, reveals another history remnant and settles. Saving does not depend on the animation finishing.

The existing bounded camera controller is reused for drag/pinch and inertia, mapped to restrained parallax. Selection disables manual camera movement until return. The top-left NEXT wordmark uses a separate equal-width/height circular View; the cinematic period remains independently rendered in 3D. Neither relies on a punctuation glyph.

## Motion, accessibility and performance

- Reduce Motion keeps the established reduced cinematic narrative, removes universe travel/parallax/drift and transient completion travel, and uses static focus with contrast changes and text crossfades.
- Native text inputs, keyboard avoidance, accessible labels, header roles, announcements and generous touch targets remain. VoiceOver and physical keyboard behavior still need device acceptance.
- One active Canvas; paused/unfocused rendering; memoized star buffers and uniforms; modest sphere geometry; one draw for history remnants; no React state updates every animation frame.
- Actual iPhone frame rate, thermal behavior and sustained GPU use are unmeasured. Shader appearance and gesture quality must be accepted on the physical iPhone.

## Files created in this pass

- `src/features/product/profile.ts` — username validation.
- `src/features/product/IdentitySetup.tsx` — integrated local profile form.
- `src/features/product/ProfileContents.tsx` — profile display/edit overlay.
- `src/features/product/Wordmark.tsx` — independent circular period.
- `src/features/product/Reveal.tsx` — restrained native text reveals.
- `src/features/product/spaceShaders.ts` — star, halo and planetary materials.
- `src/features/product/ProductScene.tsx` — settled composition, camera focus and consequence.
- `src/features/product/ProductCanvas.tsx` — native Canvas/gesture adapter.
- `src/features/product/ProductCanvas.web.tsx` — browser Canvas/pointer adapter.
- `docs/DESIGN_PASS.md` — this report and asset gate.

## Files modified in this pass

- `src/features/experience/model.ts` — profile fields/action.
- `src/features/experience/ExperienceProvider.tsx` — session entrance state.
- `src/features/product/persistence.ts` — validation and old-save migration.
- `src/features/product/Screens.tsx` — branch selection, universe overlays, completion presentation and replay/reset controls.
- `src/features/product/ProductSpace.tsx` — scene host and projected native object targets.
- `src/features/dev/cinematic/CinematicScene.tsx` — optional pause/resume clock, decaying residual motion and optional astronaut hiding; defaults preserve the dev route.
- `src/features/dev/personalization/PersonalizationScreen.tsx` — optional integrated profile/returning arrival bridge and recovery behavior.
- `scripts/verify.cjs` — profile, migration, reset and preservation assertions.

No dependency, package manifest, lockfile, Metro or app-config changes in this pass. No assets acquired. Original `src/features/universe/*`, approved cinematic timing/profile modules, Gemini client, server, model and prompt are unchanged relative to the start-of-pass hash snapshot. Existing uncommitted changes from earlier work are retained; no commit or push was made.

Current `git status --short` (includes work that already existed before this pass):

```text
 M package.json
 M src/app/index.tsx
 M src/app/universe.tsx
 M src/features/dev/cinematic/CinematicScene.tsx
 M src/features/dev/personalization/PersonalizationScene.tsx
 M src/features/dev/personalization/PersonalizationScreen.tsx
 M src/features/experience/ExperienceProvider.tsx
 M src/features/experience/model.ts
?? .env.example
?? docs/
?? scripts/
?? server/
?? src/app/dev/reset.tsx
?? src/app/reflect.tsx
?? src/features/product/
```

The manifest/routes/PersonalizationScene changes shown above predate this pass. The file lists above identify this pass's changes using the initial hash snapshot. `git diff --check` passes.

## Verification

- `npx tsc --noEmit` — passed.
- `node scripts/verify.cjs` — passed: lifecycle, restoration, fallback/timeout/cancellation, Gemini validation, new profile validation/migration/reset and preserved history.
- `npx expo export --platform ios --dev --output-dir /tmp/next-design-ios-final` — passed, 34 existing assets, approximately 12 MB development JS.
- `npx expo export --platform web --output-dir /tmp/next-design-web-final` — passed, 15 static routes, approximately 2.3 MB JS.
- Both exports contain the configured public backend URL. Private byte comparison confirms the actual server API key is absent from both export directories.
- Browser: first-time profile form, continuation into astronaut/first reflection, remaining questions, returning entrance, profile camera/edit, restored name/history, Today, real Gemini result, Begin/Complete and History exercised. No major browser runtime errors observed.
- Non-fatal warnings: Three.js CommonJS deprecation during web static export; Three Clock / React Native Web pointerEvents and shadow/textShadow style deprecations during browser use; NO_COLOR/FORCE_COLOR environment warning during export. WebGL context-loss logs occurred when old Canvas instances were disposed during navigation/reload; the next scenes rendered successfully.
- Export/browser success does not certify Expo Go GPU compatibility. Physical iPhone remains the final visual/performance, Reduce Motion, keyboard, VoiceOver and gesture gate.

## Realistic astronaut — approval required, not acquired

Candidate: **Astronaut in Spacesuit Rigged and Animated**, **Adrian Kulawik**. [Official listing and previews](https://www.artstation.com/marketplace/p/5jd1Y/astronaut-in-spacesuit-rigged-and-animated).

Published facts: GLB, FBX, USD, OBJ/MTL, ABC and Blender files; `Astronaut.glb` 33 MB; texture archive 27 MB; 4K PBR albedo, normal, roughness, metallic and bump maps. Rigged, with flying/walking/running/energy animations. Runtime polygon count, exact material/texture counts and GLB-specific animation contents are UNKNOWN. The described two-million-polygon model is the bake source, not a verified runtime mesh count.

Displayed prices: Standard $22.61; Extended Commercial $34.51, with tax dependent on checkout. For a commercial app, propose **Extended Commercial**. [ArtStation stock-asset terms](https://www.artstation.com/marketplace-product-eula) permit modification and embedding in a larger work; standalone asset redistribution is prohibited. Extended allows unlimited commercial projects/sales/views. Preserve required proprietary notices. No separate attribution requirement was identified in the standard terms; verify the purchased asset's included license before use.

Proposed optimization target is **5–12 MB packaged**, not a measured result or guarantee. Start with 1–2K textures and inspect geometry/materials before setting a final budget. The unoptimized 33 MB GLB and 4K maps are unsuitable to import blindly; GPU texture memory can greatly exceed download size. Visor/material quality under restrained lighting and branding must be inspected before integration.

Current Expo Metro asset extensions do not include glb/gltf/bin. For a self-contained GLB, the smallest proposed config change is adding `glb` to Expo's asset extensions while preserving the existing native Three ESM resolver. No change is made yet. Three already supplies GLTFLoader; the installed R3F native adapter patches file/texture loading via Expo Asset/File System. No new native dependency is proposed. Embedded image decoding, skinning, animation and any compression extensions remain unverified until the exact file is inspected and tested in Expo Go. Prefer an uncompressed self-contained GLB; do not assume web decoder paths work natively.

**Gate:** approve the candidate/license/acquisition and scoped GLB Metro change separately. Nothing has been purchased, downloaded, imported or converted. The existing proxy remains temporary.

## Physical iPhone acceptance steps

1. Keep the working backend running. If needed, from the repository run `npm run server`; keep the iPhone and Mac on the same network and the existing public LAN backend URL reachable.
2. Stop your current Expo Metro with Ctrl+C, then from the repository run `npx expo start --lan --clear`. Scan its QR code with the iPhone Camera and open Expo Go.
3. Existing completed save: verify NEXT/slogan/circular light → travel → universe, with no repeated setup/questions. Your old name initially becomes Traveler; tap the astronaut to rename it.
4. Tap Today: verify camera approach, ordered title/action/rationale/action reveal, existing Gemini task, Begin and Complete. Verify light transfer, lasting hero change and History record.
5. Tap History and the astronaut. Return to universe from each. Check drag and pinch stay bounded and stable, and do not leave active trails.
6. Reload Expo Go: identity must replay, then restore username/current task/history. A quick background/foreground of the still-running process is not a cold launch.
7. To test a fresh profile, use the development ellipsis → RESET & REPLAY ONBOARDING, confirming only if you intend to erase this device's demo progress. Verify keyboard/input, ENTER fade, astronaut discovery, first reflection, remaining personalization and Gemini generation.
8. Use REPLAY ENTRANCE · KEEP PROGRESS to repeat the entrance without deleting state.
9. Enable iOS Settings → Accessibility → Motion → Reduce Motion and repeat selection/completion. Verify static compositions/crossfades and fully usable controls. Also check VoiceOver and larger text.
10. Judge sustained smoothness, warmth/contrast, circular points and shader stability on the real iPhone. Report any new native runtime error before further architecture changes.
