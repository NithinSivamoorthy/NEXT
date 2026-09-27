# Dedicated auth screen

## Correction

The previous pass restyled `IdentitySetup` as an overlay rendered on top of the running cinematic. That was the wrong shape. Authentication is now a real screen at its own route, with its own background, layout, keyboard handling and transition lifecycle. `IdentitySetup.tsx` has been deleted; its field design, validation, masking and safety logic were carried into the new screen.

Proof it is genuinely separate: the web export emits `/auth` as its own route; `AuthScreen.tsx` imports no part of the cinematic; `PersonalizationScreen.tsx` contains no reference to an identity overlay. `scripts/verify-auth.cjs` asserts all three.

## Flow

First launch:

`NEXT.` → slogan → point → acceleration → lightspeed → deceleration → **`/auth` — create account** → departure → astronaut reveal → personalization → universe.

Returning launch: `NEXT.` → cinematic → restored universe. No auth screen.

The cinematic and the auth screen are separate route mounts, so the GL canvas is torn down while the screen is black and rebuilt on the way back. The seam is hidden inside the fade the transition already calls for.

## Handoff out of the cinematic

`CinematicScene` gained nothing new — it already accepted `initialTime`. `PersonalizationScreen` now takes `handoffAt` / `onHandoff` instead of gating an overlay, and the travel clock is no longer paused. At 12.6s (13s with Reduce Motion) the travel is still decelerating on its own curve, so the trails shorten and the last particles pass naturally while a black overlay fades in over 700ms (300ms reduced). The clock keeps running throughout; the position it reaches when the fade completes is what the screen resumes from, so nothing is replayed or skipped.

If the renderer fails, the launch still reaches `/auth` rather than stranding on a dead screen.

## The screen

`src/features/product/AuthScreen.tsx`, routed at `src/app/auth.tsx`.

Background is its own residual space: 34 drifting motes, two brighter near stars, and two very faint celestial glows built from large coloured shadows. The field animates from a single looping value whose interpolations return to their start, so the loop never snaps, and it is the only natively driven animation on the screen — its values are never combined with the form's, which stay JS-driven like the rest of the app. Reduce Motion renders the field static.

Entrance resolves in one 1300ms pass (260ms reduced), staggered by interpolating sub-ranges of a single value: stars, then `NEXT.`, heading, tagline, each field in turn, the button, then the secondary action.

Create mode:

```
NEXT.
CREATE YOUR IDENTITY
YOUR UNIVERSE STARTS WITH YOU.
USERNAME / PASSWORD / CONFIRM PASSWORD
ENTER YOUR UNIVERSE
ALREADY HAVE AN IDENTITY? → SIGN IN
```

Sign-in mode:

```
NEXT.
WELCOME BACK.
YOUR UNIVERSE IS WHERE YOU LEFT IT.
USERNAME / PASSWORD
ENTER NEXT
NEW HERE? → CREATE YOUR IDENTITY
```

Switching modes clears both secrets and re-resolves the composition from part way rather than rebuilding the screen. The username survives the switch.

Fields are a nearly invisible dark surface inside a 1px outline at 2px radius — not a rounded card. Focus brightens the outline to `#efdcba`, lifts the surface, spreads a contained glow and brightens the label over 240ms. Typing itself is not animated. Labels are Space Grotesk at 10px/2px tracking; entered text is Inter at 17px.

## Departure

One linear 1100ms clock (300ms reduced) drives the whole exit:

| Range | Effect |
| --- | --- |
| 0 – 0.25s | Keyboard dismisses; button boundary and glow concentrate |
| 0.2 – 0.65s | Interface darkens and the fields fade |
| ~0.55s | The gathered light forms a single point |
| 0.6 – 1.1s | The point opens outward into depth as the screen reaches black |
| 1.1s | `completeAuth()`, then `router.replace('/')` |

The cinematic then remounts at the handoff position and fades up out of black over 700ms, continuing its existing travel into the astronaut discovery, first contact, personalization and the universe. No part of that sequence changed.

## Demo authentication

This is demo identity. No account exists anywhere and no auth provider was added. **Real account authentication is future production work** — when it arrives, the returning-user check below becomes a real session check.

Persisted: `username` and `profileCreated`, through the existing `profile` action.

Never persisted, logged or transmitted: the password and its confirmation. They live in this component's state only and are cleared synchronously before anything else runs on entry, so no reducer, storage write, backend call or Gemini request can observe them. The screen contains no `console.*`, no `fetch`, and no storage write of its own; the only action it dispatches is `{type:'profile',username}`. `persistence.decode` already whitelists persisted fields, so an imported save carrying a `password` key cannot reintroduce one.

Create requires a valid username, 8+ characters, and a matching confirmation. Sign-in requires a valid username and 8+ characters, then checks the username against the one identity this device holds — a mismatch says so, and a device with no identity is told to create one instead of failing silently. Fields explain themselves only after being left, so nothing is red while it is still being typed.

## Keyboard

Because this is a dedicated screen, it owns its keyboard behaviour: `KeyboardAvoidingView` over a scroll view that keeps taps working, the heading block compacting to 86% with reduced spacing, the tagline and demo note collapsing to zero height, and the confirm field scrolling itself into view on focus. Return moves username → password → confirm, and submits from the last field. Nothing else moves, and no astronaut is behind the keyboard because the astronaut has not appeared yet.

## Returning users and dev controls

`profileCreated` false (fresh device, or after Reset) routes through `/auth`. Once set, every later cold launch still plays the `NEXT.` entrance — entrance state is session-only and never persisted — and goes straight on toward the restored universe. Personalization is gated separately by `firstConsequenceComplete` / `onboardingComplete`, so a returning user cannot be sent back through it.

Development screen keeps `RESET & REPLAY ONBOARDING` and `REPLAY ENTRANCE · KEEP PROGRESS`, and adds `PREVIEW CREATE ACCOUNT · KEEP PROGRESS` and `PREVIEW SIGN IN · KEEP PROGRESS`, which open the real screen in either mode without erasing anything. The preview flag is session-only and clears when the entrance finishes.

## Routing diagnosis (physical iPhone: auth screen not appearing)

Traced with `scripts/verify-launch-routing.cjs`, which renders the real `RestoredLaunch`, `ProductUniverse`, `ReflectionScreen`, `ResetScreen` and `PersonalizationScreen` against a simulated router.

| # | Suspect | Finding |
| --- | --- | --- |
| 1 | Persisted `profileCreated` skipping `/auth` | **Cause.** With an identity on the device, `needsAuth` is false and the launch goes straight to the universe. Working as designed — but it is the only thing that skips the screen, and it is what a device tested across earlier sessions will be in. |
| 2 | Reset not clearing what routing reads | Not a fault. `reset` returns `initialExperience`, `profileCreated` becomes false, and both storage slots are rewritten. |
| 3 | `onHandoff` not firing on native | Not a fault. The scene's `onClock` crosses `handoffAt`, runs the 700ms fade, then calls `onHandoff` once with the clock position. |
| 4 | Navigation to `/auth` not happening | Not a fault. `beginAuth(seconds)` then `router.replace('/auth')`. |
| 5 | Something replacing `/auth` | Not a fault. `src/app/auth.tsx` re-exports the screen with no guard. |
| 6 | Handoff position lost in navigation | Not a fault. It is session state in the provider, outside the unmounting screens. |
| 7 | Reset user classed as returning | Not a fault. `branch` is `first` and `arrivalOnly` is unset. |
| 8 | Router layout guard redirecting | Not a fault. `_layout.tsx` is a bare `Stack`. |
| 9 | Fast Refresh masking the fresh path | **Real, fixed.** `needsAuth` was captured with `useState`, so a first-render copy survived Fast Refresh. Now derived each render. |

**Second real fault, found while tracing.** `ProductUniverse` and `ReflectionScreen` rendered `<ProductLaunch/>` inline whenever `entranceComplete` was false, instead of redirecting. Because `router.replace` leaves the previous screen mounted beneath, resetting or replaying from the universe left *two* launches running: two cinematics, two GL canvases, two astronaut loads, and two competing `router.replace('/auth')` calls a few hundred milliseconds apart. Harmless in a browser; on an iPhone in Expo Go it is two live GL contexts. Both screens now `<Redirect href="/"/>`, so only `/` ever owns a running entrance. The dev controls additionally clear the stack with `dismissAll()` before navigating, so nothing is left mounted underneath.

**Dev diagnostics added.** The development screen now prints the exact values the branch reads — identity, onboarding, entrance, preview, resume, and the route the next launch will take after lightspeed — so this question can be answered on the device. In `__DEV__`, Metro also logs `NEXT launch: {...}` on each branch decision and `NEXT launch: handing off to /auth at <seconds>`. Neither logs anything from the auth form.

## Verification

Passed: TypeScript; `scripts/verify-auth.cjs`; existing `verify.cjs`, `verify-photos.cjs`, `verify-astronaut.mjs`; development iOS export including the GLB; web static export emitting `/auth`.

`scripts/verify-auth.cjs` renders the real screen against small hook and animation fakes, with no test dependency, and covers: the route's structural separation from the cinematic; both hierarchies and mode switching; rejection of empty, short, malformed and mismatched input; masking and autofill exclusion on both secrets; that the secrets are observably in state while typed and gone by the time entry proceeds; that only `{type:'profile',username}` is dispatched; that a refused sign-in explains itself and navigates nowhere; hint timing; the 1100ms departure followed by handback; Reduce Motion; and the fresh/restored/reset routing contract including credential stripping on restore. Two mutations (removing the confirm-field discard, and shortening the departure) were checked to fail.

Real-renderer check in a browser: `/auth` mounts with the full account-creation hierarchy, three real inputs of which two are `type="password"` with `autocomplete="off"`, no console errors; pressing `SIGN IN` switches to the two-field `WELCOME BACK.` hierarchy with `ENTER NEXT`; `/` mounts the cinematic with no auth fields present.

Not verified: animation timing and feel, real layout, and keyboard behaviour. The preview pane was hidden, so `requestAnimationFrame` never fired and neither the cinematic clock nor the screen's own timings could advance. These are physical-iPhone gates.

## Physical-iPhone test

Backend running, then stop Metro and start it fresh:

```sh
npx expo start --lan --clear
```

1. **Choose one.** To keep your data: Development `···` → read the `AFTER LIGHTSPEED →` line, then press `PREVIEW CREATE ACCOUNT · KEEP PROGRESS`. To test the genuine fresh path: `RESET & REPLAY ONBOARDING` → confirm, on disposable data only. Either way the next steps are identical. `OPEN /auth NOW · SKIP CINEMATIC` jumps straight to the route if you only want to check the screen.
2. **Entrance.** `NEXT.` → slogan → circular point → acceleration → lightspeed. Confirm the period is round, never square.
3. **Handoff.** Watch the trails shorten and the last particles pass as the screen darkens. There must be no navigation cut and no flash of white.
4. **Arrival.** The auth screen resolves out of the darkness: faint stars drifting behind, then `NEXT.`, then `CREATE YOUR IDENTITY`, then the three fields in turn, then the button.
5. **Empty state.** `ENTER YOUR UNIVERSE` is inert. Tap it and confirm nothing happens.
6. **Fields.** Focus each: outline brightens, glow stays contained, label lifts. Both password fields show dots, and iOS offers no saved password and no "strong password" sheet.
7. **Validation.** Enter a 4-character password and leave the field — it explains. Mismatch the confirmation and leave it — it explains. Fix both and confirm the button gains its glow.
8. **Keyboard.** With the keyboard up, confirm the focused field and the button stay visible, the heading compacts rather than jumping, and the background stays still. Return moves username → password → confirm.
9. **Mode switch.** Tap `SIGN IN` → `WELCOME BACK.`, two fields, `ENTER NEXT`. Tap `CREATE YOUR IDENTITY` to return; confirm the passwords were cleared.
10. **Entry.** Press `ENTER YOUR UNIVERSE`: keyboard dismisses, the button brightens, the interface darkens, light gathers to a point, the point opens into depth, and the travel resumes.
11. **Astronaut.** Confirm the real astronaut appears in the discovery — no T-pose, opaque visor, hero-star lighting on one side — then continue through first contact and personalization into the universe.
12. **Returning launch.** Fully close Expo Go and reopen. The `NEXT.` entrance plays, auth is skipped, the universe is restored with your data.
13. **Sign-in path.** Development → `PREVIEW SIGN IN · KEEP PROGRESS`. Enter the wrong username and confirm it says no identity by that name. Enter the right one and confirm it continues.
14. **Reduce Motion.** Enable it in iOS settings and repeat from step 1: the auth screen still appears, arrives and leaves by fade, the star field is still, and there is no travelling point.
15. **Regressions.** Gemini generation, Today, BEGIN → COMPLETE with optional photo and the 2.1s submission, History card and detail, Journey, Time Capsule, `I'VE MOVED FORWARD`, planet rotation.

## Files

Added: `src/features/product/AuthScreen.tsx`, `src/app/auth.tsx`, `scripts/verify-auth.cjs`, this report.

Removed: `src/features/product/IdentitySetup.tsx`, `scripts/verify-identity.cjs`, `docs/IDENTITY_BEAT.md`.

Modified: `src/features/dev/personalization/PersonalizationScreen.tsx` (handoff and resume instead of an overlay), `src/features/product/Screens.tsx` (launch routing and dev controls), `src/features/experience/ExperienceProvider.tsx` (session-only auth handoff state).

Unchanged: opening pacing and travel curve, `CinematicScene` timeline, the astronaut integration, personalization, Gemini client/server/model/prompt, task lifecycle, photos, history, capsules, recap, Journey, dependencies, `package.json`, `package-lock.json` and `app.json`.

No commit or push.
