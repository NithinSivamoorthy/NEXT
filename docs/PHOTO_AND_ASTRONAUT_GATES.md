# Photo completion and astronaut inspection gate — 2026-09-27

## Scope

Implemented optional local completion photos. Astronaut integration remains blocked before Metro/config changes; no model has been downloaded or imported. No commits or pushes.

## Dependencies and permission configuration

Ran `npx expo install expo-image-picker`. Installed:

- Direct: `expo-image-picker@57.0.20` (`~57.0.20` in package.json).
- Transitive: `expo-image-loader@57.0.1`.
- Lockfile changes: root dependency entry plus those two package records only. No existing package version changed.

`app.json` adds the image-picker config plugin with a purpose-specific photo-library explanation and `cameraPermission: false`, `microphonePermission: false`. These settings configure future native builds; Expo Go uses its own already-built permission declarations. The app invokes library selection only, never camera capture. On iOS, full or limited permission is accepted; denial leaves completion available and explains Settings. Android uses the system image picker without requesting broad library access.

## Local photo flow

COMPLETE → optional ADD PHOTO → library → preview/change/remove → optional written memory → SUBMIT → original 2100ms animation (550ms reduced motion) → existing completion action with optional `photoUri` → History card/detail.

- Copies picker output into `Paths.document/next-memory-photos/memory-<unique-id>.<extension>` using installed Expo File System. The copy must exist and be nonempty before preview/commit.
- Single images only; compatible representation, quality 0.7, no requested EXIF/base64. Rejects images above 36 megapixels or 20 MiB to bound local resource use. Compression is not a guaranteed pixel resize.
- Cancel retains any existing selection. Denial/copy errors do not block photo-free completion.
- Replacement, removal, cancel/unmount and late picker results clean uncommitted owned files. The source library/cache image is never deleted.
- Submission is disabled while a picker/copy is pending. The committed copy survives composer unmount and reload; history stores its local URI.
- An explicit Reset first writes both cleared save slots, then deletes only the dedicated owned photo folder. Failure reaches the existing retry-save notice; retry repeats cleanup. An interrupted process can leave an orphan draft until Reset.
- Photos remain device-local; no photo bytes/URI enter the Gemini request or backend. Existing Gemini client/server files are unchanged.
- Web deliberately explains that photo selection is available in the native app; it retains photo-free completion and does not persist ephemeral browser blob URLs.
- No backup/sync guarantee. Uninstalling Expo Go or clearing its app data removes these local memories.

## Verification

Passed:

- `npx tsc --noEmit`.
- `node scripts/verify.cjs`: existing state/lifecycle, memory restore, duplicate prevention and Gemini contract/fallback checks.
- `node scripts/verify-photos.cjs`: mocked native permission denial/limited access, Android selection, cancel, copy, size guards, copy failure, draft removal, late results/unmount, preview wiring, no-image/image commit after 2100ms, native storage round-trip after deleting cache source, reset cleanup, web fallback.
- Development iOS export: `npx expo export --platform ios --dev --max-workers 2 --output-dir /tmp/next-photo-ios-final`.
- Web export: `npx expo export --platform web --max-workers 2 --output-dir /tmp/next-photo-web-final` (16 routes).
- Live local backend health: HTTP 200, configured, `gemini-3.5-flash-lite`. Synthetic text-only `/next` request: HTTP 200 with expected content fields.
- `git diff --check`.

Warnings:

- Online `npx expo install --check` exits 1: pre-existing TypeScript 5.9.3, current SDK metadata recommends ~6.0.3. Left unchanged; actual compiler passes. The offline bundled-map check passed, but the online result is the authoritative reported check.
- Install reports the existing expo-modules-core / react-native-worklets optional peer mismatch and 13 moderate audit findings. No repair commands run.
- Exports report existing Three.js CommonJS deprecation (web) and NO_COLOR/FORCE_COLOR environment warnings.
- Browser runtime reports existing RN Web shadow style / Three.Clock deprecations. The browser reached the first-contact scene, but the full completion flow was not exercised through browser UI; component tests above use mocks.

Mocked tests and exports are not physical iPhone acceptance. Native picker UI, permission prompts, photo decoding, smoothness and relaunch must be tested on the phone.

## iPhone acceptance checklist

Stop your existing Metro with Ctrl+C and restart from the repository:

```sh
npx expo start --lan --clear
```

Open the refreshed QR/project in Expo Go, on the same network. Keep the existing backend running.

1. Open/begin a NEXT, then COMPLETE; SUBMIT without photo. Confirm one completion after the original animation.
2. For another NEXT, ADD PHOTO; deny access if prompted. Confirm brief explanation and working photo-free submission. Allow Photos in iOS Settings for Expo Go afterward (limited access is supported).
3. ADD PHOTO, cancel. Confirm the composition is unchanged. Select a photo; inspect preview, change/remove, then select again.
4. Add a written memory, SUBMIT once; confirm animation, one History card with photo, matching detail/memory.
5. Reload Expo Go, return through the existing entrance, reopen History; confirm photo remains.
6. On disposable demo data only, use development Reset, confirm history is cleared. Reset deletes owned copies, never library originals.

## Astronaut — package inspection blocked

Preferred candidate: **Astronaut by IvanPetrov**

Source: https://sketchfab.com/3d-models/astronaut-d5a16f7ec11c4b1d876059cbf6adbf56

Verified on its rendered official page:

- Free download offered.
- CC Attribution link points to **CC BY 4.0**: https://creativecommons.org/licenses/by/4.0/
- Published approximate geometry: **10.8k triangles / 5.7k vertices**. These are listing figures, not an archive measurement.
- Preview: realistic white suit with red bands, backpack, visible face behind visor, outstretched T-pose, real-world-looking chest patches. Shape/proportions are plausible; visor reflections, patch branding and a usable floating pose need archive inspection before acceptance.

Blocker: the available browser is signed out; Download does not open a package dialog and the page logs a MutationObserver error. Sketchfab's official download API also requires authenticated access: https://sketchfab.com/developers/download-api/downloading-models . No package was acquired, no viewer resources were ripped, and no substitute was selected. An authenticated user download of the original package is needed to finish this gate.

| Requested package fact | Result |
| --- | --- |
| Exact archive size / runtime size | UNKNOWN — no package |
| Exact downloadable formats | UNKNOWN — not inferred from generic Sketchfab format support |
| Exact geometry / mesh count | UNKNOWN — only approximate listing count above |
| Material count / material compatibility | UNKNOWN |
| Texture count, file sizes, resolutions | UNKNOWN |
| Skeleton / rig / weights | UNKNOWN — T-pose is not proof of rigging |
| Animation clips | UNKNOWN |
| Included license/attribution file | UNKNOWN — page license verified, archive not obtained |
| Final visual/commercial presentation suitability | Pending material/patch/pose inspection |

CC BY 4.0 permits commercial sharing and adaptation with credit, source/license links and an indication of changes. It does not itself clear third-party marks or imply endorsement. If ultimately used, include visible attribution and preserve the license/source/change record in the repo. Proposed credit: “Astronaut by IvanPetrov, via Sketchfab, CC BY 4.0; modified for NEXT” (only state modifications actually made).

### Proposed configuration change — NOT applied

If the inspected runtime asset is a self-contained GLB with supported textures/materials and no unsupported compression, the smallest Metro addition, after `getDefaultConfig`, is:

```js
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, 'glb'])];
```

For an external glTF package, the analogous extension list would include `'gltf', 'bin'` instead, with its texture references handled explicitly by the future loader. Exact packaging cannot be finalized before inspecting the archive. Keep the existing native `three` resolver unchanged. No loader, asset import, decoder, model animation or Metro edit is implemented here.

An unrigged model could support whole-body drift/orientation/roll; a fixed T-pose still needs an acceptable silhouette. No fabricated limb deformation is proposed. Useful animation clips cannot be named until the archive is inspected.

## Files changed in this pass

Modified: `package.json`, `package-lock.json`, `app.json`, `src/features/experience/ExperienceProvider.tsx`, `src/features/product/MemoryUI.tsx`, `src/features/product/Screens.tsx`.

Added: `src/features/product/photos.ts`, `src/features/product/photos.web.ts`, `scripts/verify-photos.cjs`, this report.

The before/after file-hash comparison is against this turn's working tree, preserving previous uncommitted work. No changes to Metro, universe/renderers, hero star, typography, identity/onboarding/opening timing, Journey, capsules, recap, task reducer, Gemini client/server/model/prompt.
