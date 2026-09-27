# Memory composition, photo reliability, and visual polish

27 September 2026. Implementation complete; physical-iPhone acceptance remains pending. No commit or push.

## 1–5. Photo diagnosis, fix, URI behavior, storage, automatic Memory

**Established code-level root cause:** `selectPhoto` called `File.copy(destination)` without awaiting it, then immediately checked `destination.exists` and `destination.size`. The installed Expo File System 57.0.7 declares `copy(...): Promise<void>` (`src/internal/NativeFileSystem.types.ts:90`) and implements it as `AsyncFunction("copy")` on iOS (`ios/FileSystemModule.swift:230`). `copySync` is a different API. The verification therefore raced the native copy and returned the generic photo error before the file was ready. Catch cleanup could also run before the copy finished. The previous test mock copied synchronously and concealed this bug.

The fix awaits the native copy before checking the durable destination. The mock now delays the write asynchronously. Removing the await in memory makes the regression fail: expected `selected`, received `unavailable`. This is a reproduced source-level defect consistent with the reported iPhone failure; confirming that it resolves every affected library asset requires the physical-device test.

Picker configuration remains single image, no editing, compatible representation, quality 0.7, no EXIF/base64. Installed iOS picker code writes a local cache image and returns `targetUrl.absoluteString`, so its expected result is a `file://` URI. `content://` is accepted for Android; raw `ph://`/remote/missing URIs are rejected rather than persisted. URI encoding is left intact. Extensions come from the URI before query/hash, with a MIME fallback. iCloud-backed image availability/download remains native picker behavior to verify on device.

Flow:

1. Accept full or limited iOS photo access; explain denial and offer **OPEN PHOTO SETTINGS** plus the original retry action.
2. Cancellation is silent. Completion remains available without a photo.
3. Validate the source and retained limits: 36 megapixels / 20 MiB.
4. Idempotently create `Paths.document/next-memory-photos` (retain the existing directory for compatibility).
5. Copy to `memory-<sanitized-next-id>-<timestamp>-<random-suffix>.<extension>` and await completion.
6. Verify a nonempty, bounded destination, then display its local URI.
7. Commit that URI on the existing completed NEXT; existing persistence saves the record.
8. `photoMemories(history)` derives completed records carrying `photoUri`. No additional database or save action exists.

Development logs contain only stage and URI-scheme classifications. They contain no URI, image bytes, metadata, or exception details. File failure copy is “WE COULDN’T ADD THAT PHOTO. TRY ANOTHER.”

Changing/removing a draft and leaving the composer remove only NEXT-owned draft files. Late picker results are cleaned after unmount. Submission transfers ownership to History before unmount cleanup. Completed photos are not deleted by draft cleanup; explicit Reset still clears them only after both reset state slots are written. Photos remain local: no upload, Gemini submission, backend request, or base64 persistence.

## 6–7. Photo action and preview

- Dark violet-blue pill, outlined camera treatment drawn with Views, Space Grotesk action, Inter “Preserve this moment.” support.
- Press brightens/concentrates its edge and compresses slightly when motion is allowed. Saving displays a disabled saving label to prevent duplicate pickers/submission races.
- Preview uses a 1.25 aspect ratio, cover sizing without stretching, subtle cool outline, and an “ATTACHED TO THIS NEXT” label.
- Change remains explicit; Remove uses muted red. Preview entrance uses the existing Reveal component.

## 8–10. Framing and all five targets

Memory's old x=-2.5 position was beyond the usable portrait view. Resting composition now uses:

| Object | World position x, y, z |
|---|---|
| Hero star | -0.45, 2.85, -0.3 |
| Memory | -1.35, 0.05, 0.1 |
| History | 1.4, 0.35, -1.6 |
| Today | -0.6, -2.0, 0.7 |
| Astronaut | 1.35, -2.8, 0.8 |

Body scales remain intact. The 48-degree camera starts at z=12.2 and backs away only as needed using viewport aspect and the shared world's extents. Framing is memoized on viewport dimensions, not recomputed/allocated each frame. Existing orbit/zoom damping and rotation controllers remain unchanged. Initial focused camera placement now resolves every world ID, including Memory and the hero star, instead of falling through to the astronaut.

`WORLDS` continues to drive projections, Animated values, caches and hit targets. There are five targets and three rotation controllers. Today/star labels have small per-world vertical offsets so they clear their larger visible bodies. Native touch areas remain 96×108, with bounded screen placement. A mutation reducing caches to three entries fails at Memory index 3.

Framing checks project body extents and target rectangles at 320×568, 375×667, 375×812, 390×844, 393×852, 430×932, 360×800, 320×900, 844×390 and 1440×900. Every target fits; portrait touch rectangles do not overlap. Restoring the old Memory x position makes the check fail. These are resting-camera checks; they do not substitute for physical touch, optical/safe-area judgment, or arbitrary zoom acceptance.

## 11–17. Visual changes

- **Universe:** stronger cool atmospheric rims and existing surface variation, warmer bounded hero core, violet Memory limb. No new geometry/particle systems were added.
- **Memory planet:** retained dark stored-light concept and fixed 26-fragment system. A photo commit briefly lifts the existing bounded stored-light uniform, without a blocking sequence. Empty Memory stays quiet. Rare star flares now obey the existing intended rule of pausing while a panel is focused.
- **Memory archive:** virtualized photo-dominant FlatList, two columns at width ≥360 and font scale ≤1.3, otherwise one. Six initial cards, four per render batch, bounded rendering window. Thin cool borders and press illumination; card labels include title/date.
- **Memory detail:** large photo, actual title/date, WHAT THIS NEXT ASKED, YOUR MEMORY, associated TIME CAPSULE sections. No content regeneration.
- **History:** remains a paginated boxed record list with cool surfaces; photographs are compact 76-point thumbnails. Detail still has the larger photo and original record. Accessible card labels now include the date.
- **Progress:** centered Clash current-streak figure, warm star anchor, separate total/longest panels, actual recent activity. Streak derivation is untouched. KEEP MOVING remains passive text.
- **Buttons:** opt-in primary/secondary/danger styling. Existing default/tertiary markup remains intact for unrelated screens. Scoped Begin/Complete/Submit and photo controls use primary styling.
- **Completion:** original 2100ms submission (550ms Reduce Motion), deferred commit and star/light consequence are retained. Brief footer now reads “NEXT COMPLETED · ANOTHER STEP FORWARD.”

## 18–20. Motion, performance, accessibility

Reduce Motion removes press compression, scene drift/time motion, transient stored-light pulse and rare flare; photo presence updates directly. Existing Reveal uses its reduced treatment. Progress stops breathing. The original completion's reduced 550ms treatment remains.

No dependencies, new texture assets, additional Canvas, postprocessing, shadow maps, or per-frame React state. Existing scene quantities remain: 900 field stars, 26 Memory fragments, up to 32 history points, unchanged body geometries and three astronaut primitives. Source-level maximum is approximately 12 draw submissions including all existing optional points/packet/astronaut primitives; no added scene draws in this pass. Actual native GPU timings/draw counts have not been measured. Photo grid virtualization reduces simultaneously mounted cards, but original-resolution image decoding can still consume memory; physical testing with large photos remains necessary.

Buttons preserve roles, disabled state and minimum 52-point height. Photo controls communicate state with text, not color alone. Memory controls expose title plus date; large text switches the grid to one column. Progress presents recent activity as one accessible summary and hides its decorative dots from individual accessibility focus. Physical VoiceOver/contrast acceptance is pending.

## 21–23. Exact files and protected areas

Created:

- `src/features/product/framing.ts`
- `scripts/verify-framing.cjs`
- `docs/MEMORY_PHOTO_POLISH.md` (this report)

Modified in this pass:

- `src/features/product/photos.ts` — awaited durable copy, filename/source validation, sanitized diagnostics, classified errors.
- `src/features/product/photos.web.ts` — accepts optional NEXT ID; existing native-only photo message retained.
- `src/features/product/MemoryUI.tsx` — photo action/preview/settings path, History thumbnails and semantics, submission hierarchy.
- `src/features/product/MemoryScreen.tsx` — virtualized responsive grid and detail hierarchy.
- `src/features/product/ProgressScreen.tsx` — momentum composition, bounded glow, accessible activity.
- `src/features/product/ui.tsx` — opt-in action variants, support/icon treatment; legacy default preserved.
- `src/features/product/worlds.ts` — five-object positions and label offsets.
- `src/features/product/ProductScene.tsx` — responsive framing, complete focus lookup, bounded Memory response, focused flare suppression.
- `src/features/product/ProductSpace.tsx` — per-world label offset; all collection-derived bookkeeping retained.
- `src/features/product/spaceShaders.ts` — existing shader color/rim/surface coefficients.
- `src/features/product/Screens.tsx` — Begin/Complete action variants and completion footer only.
- `scripts/verify-photos.cjs` — asynchronous native mock, mutation mode, uniqueness/replacement/removal/automatic Memory checks.
- `scripts/verify-momentum.cjs` — FlatList-aware screen harness, single/two-column checks, new presentation ordering; all prior assertions retained/adapted.
- `scripts/verify-universe-targets.cjs` — in-memory three-cache mutation switch.

SHA-256 comparison against the pre-pass snapshot confirms package.json, package-lock.json, Metro and app.json are unchanged. No files were removed. Astronaut source/assets, cinematic/personalization files, auth source/routes, original universe feature, ExperienceProvider/model/persistence, streak algorithm, Gemini client/backend/prompt are unchanged in this pass. Existing uncommitted work from previous passes remains in place.

## 24–26. Verification, warnings, limits

Passed on final source:

- `npm run typecheck`
- `node scripts/verify.cjs`
- `node scripts/verify-auth.cjs`
- `node scripts/verify-launch-routing.cjs`
- `node scripts/verify-photos.cjs`
- `node scripts/verify-momentum.cjs`
- `node scripts/verify-universe-targets.cjs`
- `node scripts/verify-framing.cjs`
- `node scripts/verify-astronaut.mjs`
- `npx expo export --platform ios --dev --output-dir /tmp/next-memory-polish-ios-final` — 1762 modules, 35 assets, astronaut included.
- `npx expo export --platform web --output-dir /tmp/next-memory-polish-web-final` — 19 static routes.
- `git diff --check`

Mutation checks deliberately fail without touching product source:

- `NEXT_PHOTO_MUTATION=1 node scripts/verify-photos.cjs`: removing await produces unavailable instead of selected.
- `NEXT_FRAME_MUTATION=1 node scripts/verify-framing.cjs`: old Memory x position leaves frame.
- `NEXT_TARGET_MUTATION=1 node scripts/verify-universe-targets.cjs`: three caches fail to place Memory index 3.

Photo verification covers cancel, permission denial/limited access, asynchronous copy, copy failure cleanup, durable record persistence/reload after cache deletion, automatic Memory membership, no-photo History-only completion, multiple unique files/records, remove-before-submit and replacement with newest photo, late picker cleanup and unchanged submission timing. Filesystem/picker tests are mocked; native library permissions/copy/decoding must be confirmed on device.

Browser at 390×844: all five bodies visible; Memory and Progress navigation work; saved counts displayed correctly; existing remote Gemini generation succeeded using synthetic test answers; Begin → Complete → web photo explanation → reflection → Submit returned to universe; History count increased to two and detail retained the exact test reflection; no-photo completion left Memory empty. No browser console errors were captured. Photo grid/detail rendering with real records is covered by the component harness; browser photo upload remains intentionally unsupported.

Remaining warnings: Three.js CommonJS/Clock deprecations, React Native Web pointerEvents/textShadow style deprecations, web native-driver animation falling back to JS, and NO_COLOR/FORCE_COLOR build warnings. Renderer context-lost informational logs occurred on scene disposal/navigation. These did not fail the checks. No package repair was performed. There is no configured lint script.

Local storage is device-local, not synced; Reset/uninstall can remove it. Large/iCloud/HEIC photos, permission changes, real GPU/frame pacing, physical gestures and VoiceOver require iPhone acceptance. Compilation is not acceptance.

## 27. Physical iPhone acceptance sequence

1. Stop only the existing Expo Metro terminal with Ctrl-C. Leave the backend running. From the existing repository:

   ```sh
   cd path/to/NEXT
   npx expo start --clear --lan
   ```

2. Keep phone/Mac on the same Wi-Fi. Open the fresh QR code in Expo Go. Do not Reset or uninstall; preserve existing records. Returning-user flow should still skip dedicated auth.
3. At resting universe view verify Memory left, History right, Today lower, astronaut lower-right, star above. Check all labels/touch areas and all five destinations. Drag/pinch the universe; rotate Today, History and Memory; return from each.
4. Complete a NEXT: tap ADD A PHOTO, then cancel. No error should appear and submission should remain enabled.
5. Pick an ordinary library JPEG/HEIC. A preview and attached label should appear. If it fails, capture the exact error and sanitized `[NEXT photo]` stage/scheme log.
6. Change to a different photo; newest preview should replace it. Remove it; preview must disappear. Pick again, add an optional reflection, submit. Observe the existing ~2.1s response and brief completion text.
7. Open History: one completion with thumbnail/reflection. Open Memory: the same completion appears automatically, with no second save action. Detail must show photo, correct title/date/action/reflection and associated capsule if present.
8. Reload Expo Go, repeat History/Memory inspection. The photo should survive after the picker cache is no longer needed.
9. Complete another NEXT with a different photo; both cards/files should remain distinct. Complete one without a photo; it belongs in History only. Inspect real counts/streak on Progress.
10. Check denied and limited photo access through iOS Settings. Denied access should explain the issue, offer Settings/retry and allow no-photo completion. Also try an iCloud-backed image and a large image; limits should be explained without losing task state.
11. Enable Reduce Motion; repeat photo press, completion, universe return and Progress. Verify no aggressive motion, usable hit areas, legible large text and summarized recent activity with VoiceOver.
12. Leave the universe running/interacting for several minutes. Confirm no crash, missing astronaut/materials, unexpected heat, persistent stutter or clipped Memory. Report any new physical error before further fixes.

## 28. Git status

The following includes pre-existing work, not just this pass. Nothing staged, committed, pushed, or reset by this pass.

```text
 M app.json
 M metro.config.js
 M package-lock.json
 M package.json
 M src/app/index.tsx
 M src/app/universe.tsx
 M src/features/dev/cinematic/CinematicScene.tsx
 M src/features/dev/personalization/PersonalizationScene.tsx
 M src/features/dev/personalization/PersonalizationScreen.tsx
 M src/features/experience/ExperienceProvider.tsx
 M src/features/experience/model.ts
?? .env.example
?? assets/astronaut/
?? docs/
?? scripts/
?? server/
?? src/app/auth.tsx
?? src/app/dev/reset.tsx
?? src/app/journey.tsx
?? src/app/memory.tsx
?? src/app/progress.tsx
?? src/app/reflect.tsx
?? src/features/astronaut/
?? src/features/product/
```
