# NEXT experience expansion — presentation pass

## Scope and status

Implemented the non-gated experience work. Photo picking is paused at the new-dependency approval gate; realistic astronaut acquisition/loading is paused at its separate asset/Metro gate. No dependencies installed, no external models acquired, no commits or pushes.

The previous identity form existed, but already-created/migrated profiles intentionally skipped it. This pass enhances the fresh-user form; it does not erase existing profiles to force returning users through setup again.

## Experience

1. **Fresh identity:** approved opening/travel → deceleration with residual spatial field → username and explicitly demo-only passphrase → ENTER YOUR UNIVERSE → fade/contraction → same cinematic resumes into astronaut discovery and personalization. Native inputs and field-specific warm focus response remain. Existing completed users retain the approved returning entrance → universe branch.
2. **Passphrase:** local component state only, minimum eight characters after trimming surrounding whitespace, masked entry, cleared synchronously before profile callback. Never enters ExperienceState, storage, logs or Gemini requests. Users are told to use a made-up value. This is not authentication; production auth remains future work. JavaScript clearing is not a claim of cryptographic memory erasure.
3. **Dedicated Journey route:** astronaut camera/rim-light focus → `/journey`, a full native page with stellar background points, cool/cream typography, dividers and staggered entrances. The old small profile overlay is replaced. Return fades the page and restores the focused camera before pulling back into the universe.
4. **Profile data:** username/edit, current NEXT/action and status, completed count, every stored personalization dimension (moving from, why, moving toward, daily commitment and chosen pace). No invented answers.
5. **Recap:** I'VE MOVED FORWARD opens a deterministic reflection using original answers, completed actions, optional memories/photos and the latest capsule. Shows up to eight recent actions with the total count; full history remains in the archive. No Gemini psychological claims, reset or deletion.
6. **Direct rotation:** focused Today/History accept drag over a generous upper world area. A separate controller rotates only the selected mesh, clamps tilt and angular velocity, and applies short damped inertia. Focus prevents camera orbit; a tap does not rotate. Native accessibility increment/decrement actions rotate the body. Reduce Motion removes inertia but preserves direct manipulation. Hero star is not spun.
7. **History:** dark violet/blue outlined fragments, warm-white title, completion date/category/time and a small mark. Six cards per page cap mounted cards/reveal animations; earlier/later page controls retain access to all records. Selecting a card transitions to a brighter outlined detail with original action, why, date, memory, associated capsule and goal context; explicit back control restores the archive.
8. **Completion:** COMPLETE opens a composition with optional written memory and NOT YET return. SUBMIT contracts/dims the composition, intensifies the outline and gathers a point of light over 2.1 seconds. Only the finished animation commits through the existing duplicate-safe reducer, followed by the established universe consequence. Reduce Motion uses a 550 ms opacity/contrast sequence. Leaving/unmounting before commit cancels the animation; the task remains active and can be submitted again. Once committed, progress is saved independently of the trailing visual consequence.
9. **Time capsule:** an optional invitation after completion links the capsule to that NEXT. The Journey page also supports unassociated letters. The composer uses native multiline input and a 1.5-second condensation/light fade before storing, shortened to 350 ms without travel in Reduce Motion. Sealed text/date/associated NEXT are readable in Journey and History detail. No scheduled notifications, cloud upload or artificial lock date.
10. **Visual expansion:** cool Today light, faint violet History, blue profile dividers and amber capsule/submission accents. Terrain contrast makes rotation more legible. The accepted hero surface/halo and opening timing remain intact.

## Persistence

Existing version-1 two-slot storage remains; no storage dependency changed.

- Existing username/profile flag, personalization, current NEXT and history remain.
- New `capsules` array: `{ id, text, createdAt, nextId? }`.
- Completed records accept optional `memory` and `photoUri` metadata. Local `file:`/`content:` references only; 2,000-character text limits.
- Old saves missing capsules migrate to `[]`; previous profile migration remains.
- Capsule IDs are unique and linked IDs must identify a completed NEXT.
- Decoder now whitelists known state/answer/record/capsule fields; unrelated credential properties are discarded on hydration.
- Password/passphrase is never serialized. No new Gemini request fields.
- UI selection, animations, camera/planet rotation and recap presentation are transient.
- Reset clears capsules with existing local progress after confirmation; recap never resets progress.
- Existing storage-error notice/retry is also available on Journey.

## Photo approval gate

`expo-image-picker` is absent from package.json/node_modules. The installed SDK's `expo/bundledNativeModules.json` specifies **`~57.0.20`**.

Smallest proposed dependency change after approval: install `expo-image-picker@~57.0.20` using npm/Expo, updating package.json and package-lock.json. It supplies the standard Expo Go-compatible system photo-library picker. No cloud service is needed. For library-only selection in Expo Go, no new Metro extension is needed. Any production permission config would be disclosed separately; camera capture is not proposed here.

Then add a single optional ADD A PHOTO action to completion, copy the chosen image into app document storage using the already-installed Expo File System, and persist its URI. The schema/detail/recap can already retain/display a local photo reference and show a missing-file fallback, but **selection and file copying are NOT implemented or device-tested**. No dead ADD PHOTO button pretends otherwise. Local files can disappear on uninstall, cache loss if not copied, device reset or failed restore; this remains a local demo without cloud backup.

## Astronaut gate

See [the research shortlist](ASTRONAUT_EXPANSION_SHORTLIST.md) for exact source links, licensing, price, mesh counts, published sizes, unknowns and exclusions. The existing proxy remains TEMPORARY. Neither the previous paid model nor any substitute has been acquired. No `.glb`/`.gltf` Metro support was added.

## Performance and accessibility

One active Canvas remains; Journey uses 24 static native points, not another GL context. Existing geometry/star buffers remain; rotation is ref-based, with two small controllers and no per-frame React renders. No shadows, bloom pipeline, physics or new textures. Card presentation is capped at six per page. Full history/capsule data remains stored.

Readable native text, keyboard-aware layouts, minimum action targets, roles/labels, capsule announcement and Reduce Motion paths are present. Real-iPhone VoiceOver, keyboard occlusion, planet gestures, sustained frame rate and thermal behavior remain acceptance tests; browser results are not substitutes.

## Files created

- `src/app/journey.tsx` — dedicated route.
- `src/features/product/JourneyScreen.tsx` — Journey/capsule/recap page and return handoff.
- `src/features/product/MemoryUI.tsx` — archive/detail, submission and capsule compositions, local-photo fallback.
- `src/features/product/memories.ts` — memory/capsule types and validation.
- `src/features/product/PlanetRotation.ts` — independent bounded direct manipulation.
- `docs/ASTRONAUT_EXPANSION_SHORTLIST.md` — asset research/approval gate.
- `docs/EXPERIENCE_EXPANSION.md` — this report.

## Files modified this pass

- `src/features/product/IdentitySetup.tsx` — demo passphrase, input glow, identity copy/animation.
- `src/features/product/ProfileContents.tsx` — full stored-answer presentation and current NEXT.
- `src/features/product/Screens.tsx` — route handoff, completion composition, capsule invitation, archive and keyboard handling.
- `src/features/product/ProductSpace.tsx` — focused-planet touch/accessible rotation target.
- `src/features/product/ProductScene.tsx` — mesh rotation, focused-camera restoration, History tint.
- `src/features/product/spaceShaders.ts` — planetary terrain contrast only; hero shaders preserved.
- `src/features/experience/model.ts` — capsules and completion metadata actions.
- `src/features/product/persistence.ts` — migration/validation/field whitelist.
- `scripts/verify.cjs` — migration, memories, capsules, credential stripping and rotation tests.

Hash comparison against the start-of-pass snapshot confirms no changes to package.json, package-lock.json, Metro, app config, Gemini client/backend/prompt/model, original universe files, cinematic/personalization implementation or ExperienceProvider. Existing earlier uncommitted work remains.

## Verification

- TypeScript passes.
- Regression script passes: existing generation/schema/fallback/offline/timeout/cancellation/lifecycle/restoration plus profile migration, unexpected credential stripping, completion metadata, duplicate/invalid capsule rejection, capsule round-trip/reset and bounded/no-inertia rotation.
- Development iOS export passes (34 existing assets, about 12 MB development JS).
- Web export passes (16 routes including Journey, about 2.3 MB JS).
- Private byte comparison confirms the actual server API key is absent from both final export directories; both contain the unchanged configured backend URL. `git diff --check` passes.
- Browser at 390×844: returning launch, astronaut → dedicated Journey, all stored answers, capsule sealing/association, recap, return, focused world dragging, Begin → composition → Submit → consequence, boxed archive/detail, memory/capsule reload restoration, live Gemini success, fresh identity with passphrase cleared on ENTER and continued astronaut discovery; reloading that new profile skipped setup again.
- Reduce Motion branches inspected; reduced rotation is covered by the controller test. Physical OS Reduce Motion and VoiceOver are not certified by these checks.
- Warnings: existing Three Clock/CommonJS deprecations, React Native Web shadow/textShadow/pointerEvents style deprecations and NO_COLOR/FORCE_COLOR export warning. No major browser runtime errors observed. Canvas disposal emits context-loss logs when navigating away; next scenes rendered successfully.
- All exports and screenshots are outside the repository. Native visual/performance acceptance remains pending.

## Exact iPhone test instructions

1. Keep the working backend running (`npm run server` if it needs starting). Keep Mac and iPhone on the same network; public backend URL remains unchanged.
2. Stop your Expo Metro with Ctrl+C. From the repository root, run `npx expo start --lan --clear`; scan the QR code into Expo Go.
3. Existing user: opening → restored universe, no identity form. Tap astronaut, verify spatial focus → full Journey page, all answers/current status, name editing and return pullback.
4. In Journey, seal a capsule and open I'VE MOVED FORWARD. Confirm your actual words/actions appear and no history disappears.
5. Open Today/History; drag over the upper planet to rotate it, then scroll text below. Confirm no accidental camera orbit and that universe drag/pinch still work after return.
6. Begin a NEXT, Complete, optionally write a memory. NOT YET must retain the active task. SUBMIT must play the short sequence and create exactly one history entry. Accept the future-self invitation if desired.
7. Open the new History card; verify why/action/date/memory/linked capsule. Reload and check persistence plus the returning entrance. Generate another NEXT and confirm the existing Gemini path still succeeds.
8. To see the fresh identity scene, use development ellipsis → RESET & REPLAY ONBOARDING only if you intend to erase this device's demo answers/history/capsules. Use a made-up passphrase of at least eight characters after trimming surrounding whitespace, never a real password. ENTER should fade into astronaut discovery. Existing profiles intentionally skip this scene.
9. Repeat key interactions with iOS Settings → Accessibility → Motion → Reduce Motion enabled, and check VoiceOver/larger text/keyboard handling. Direct rotation remains but inertia and aggressive animation disappear.
10. Photo selection and final realistic astronaut cannot be accepted yet: their explicit approval gates remain open.

## Git status

The working tree remains dirty from this and previous uncommitted passes. No commit or push was performed. Existing package.json/root-route/cinematic/ExperienceProvider modifications in status predate this pass; compare the explicit file list above for this pass.

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
?? src/app/journey.tsx
?? src/app/reflect.tsx
?? src/features/product/
```
