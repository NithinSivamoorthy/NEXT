# Memory planet and hero-star momentum

Two connected additions to the accepted universe. Nothing existing was rebuilt: the cinematic, auth, astronaut, personalization, Gemini, Today, History, photos, capsules and Journey are untouched.

## 1. Memory planet design

A fifth body at `(-2.5, -0.3, 0.45)`, radius 0.47 — left of the hero star, clear of History's corner and outside the star's halo. It has its own fragment shader (`memoryFragment`) rather than a re-tinted `planetFragment`, so it reads as a different kind of object:

- A dark body on a muted violet-grey tint, with two-scale surface variation (fine grain modulating broad strata).
- A warm amber atmospheric rim, with a violet secondary at the extreme limb.
- **Stored light**: sparse points held beneath the surface, revealed by a `stored` uniform. A device with no photos shows a dark, quiet world; the light appears as memories are kept. The planet literally holds what the user preserved.
- A ring of 26 additive fragments orbiting slowly, hidden entirely while `stored` is near zero.

Slow rotation comes from the existing `PlanetRotation`, so dragging it turns it exactly as Today and History do, with the same inertia, bounds and tap/drag separation. It is not Earth and carries no photographic texture.

## 2. Memory archive

Tapping Memories focuses the camera and hands off to `/memory`, the same accepted transition Journey uses. The archive is photographic: each memory is a card whose photo is the dominant object, over a very dark surface with a thin luminous border and a warm stellar shadow.

Each card carries the photo, the NEXT title, the stored completion date formatted as `SEP 27, 2026`, and the first two lines of the written memory when one exists. Nothing else — the photo keeps the weight. Cards scroll vertically and stagger in through the existing `Reveal`.

## 3. Memory detail

Tapping a card opens it in place: a larger photo, the date, the title, `WHAT THIS NEXT ASKED` with the original action, the written memory if present, and any Time Capsule sealed against that NEXT. `← ALL MEMORIES` returns to the archive, `← RETURN TO UNIVERSE` leaves. Every field is read from the persisted record; nothing is regenerated and Gemini is not involved.

## 4. How photo records are sourced

`photoMemories(history)` returns completed NEXTs that actually carry a `photoUri`. There is no second store, no new field and no copy of anything: Memory is a view over the same records History shows, filtered to those with a photo, using the completion-photo infrastructure already in place. A completion without a photo stays in History and still counts toward momentum, but never appears in the archive and never gets a placeholder. Photos remain local — nothing is sent to Gemini, the NEXT backend or any cloud.

## 5. Streak rule

Stated in full, and in the code at `src/features/product/progress.ts`:

- A completed NEXT counts on the **local calendar day** of its stored `completedAt`.
- Several completions on one day advance the streak **once**; they all still count toward the total.
- The **current streak** is the run of consecutive days ending today. A run ending yesterday is still alive, because today is not over. Anything older reads zero.
- The **longest streak** is the longest run anywhere in the record, including the current one.
- Nothing is inferred. With no completions every figure is zero, and days before the first completion are marked `before` rather than counted as missed.

Day arithmetic goes through the local `Date` constructor, never a fixed 86,400,000 ms offset, so a streak survives a daylight-saving change. A record with an unreadable timestamp is skipped rather than counted on the epoch.

## 6. Streak derivation

`deriveMomentum(history, now, window)` recomputes everything from the persisted history on each call and returns `{total, current, longest, lastDay, days}`. No counter is stored anywhere, so none can drift and none can disagree with History. `now` is a parameter, which is what makes the rule testable.

## 7. Hero-star visual progression

`momentumLevel(streak) = 1 - e^(-streak/3.2)` — saturating, not linear: 0 at no streak, 0.27 at one day, 0.61 at three, 0.79 at five, 0.92 at eight, and approaching its designed maximum thereafter. It cannot exceed 1 at any streak length, so the star cannot become a white blob.

That single bounded value drives several restrained properties together, all modifications of the existing star rather than new objects:

| Property | At zero streak | At maximum |
| --- | --- | --- |
| Core heat threshold | baseline | hot region widens (`smoothstep` window shifts 0.12/0.20) |
| Core brightness | baseline | +22% |
| Overall energy | baseline | +0.16, plus a ±0.02 breath |
| Star scale | 0.56 | +0.045 |
| Corona falloff / structure | baseline | softer falloff, +0.030 amplitude |
| Halo scale | ×5.8 | ×7.3 |
| Haze | 0.055 | 0.085 |
| Key light on the scene | 30 | 39 |
| Flare | none | a brief lift every 16–38s, scaled by level² |

The flare is scheduled on the CPU and passed as a uniform, so it is a rare event rather than a constant flicker, and Reduce Motion forces it to zero.

## 8. Completion → star response

The existing submission sequence is unchanged, including its 2.1-second commit. When the completion commits, `history` changes, `deriveMomentum` recomputes, and the new level flows into the scene. The star eases toward it rather than snapping (`live` lerps at `blend × 0.45`), so a completion that starts or extends a streak is felt as the star coming up. The existing light packet still travels from Today to the star and the existing pulse still fires, so the arrival and the new resting state read as one event. There is no XP, no level-up and no confetti.

## 9. Progress screen

Tapping the star focuses it — the star is *not* dimmed for its own focus, unlike the other bodies — and hands off to `/progress`. The screen is anchored by a two-dimensional restatement of the hero star whose size, glow and pulse scale with the same bounded level, so the universe's anchor is the screen's anchor.

Below it, three figures in 62px Clash Display with Space Grotesk labels: `CURRENT STREAK`, `LONGEST STREAK`, `NEXTS COMPLETED`, singularised correctly. Then recent days, then one line of context and `KEEP MOVING.` No charts, no gamified copy, no badges.

## 10. Recent activity visualization

Fourteen points of light, one per day, oldest to newest. A day with a completion is a warm point; a day in the live streak is brighter and carries a shadow glow; consecutive days of the live streak are joined by a thin line drawn only between them. A day before the first completion is nearly black — absent rather than failed — so a new user is never shown two weeks of misses. It is plain views, no chart library and no per-frame work.

## 11. Empty states

**Memory, no photos:** `MEMORIES` / `YOUR UNIVERSE REMEMBERS WHAT YOU LIVED.` / "Complete a NEXT and leave a photo behind. It will be kept here." plus a reminder that completed NEXTs stay in Previous NEXTs either way. No placeholder cards and no invented memories.

**Progress, no completions:** `YOUR MOMENTUM` / `0` / `NEXTS COMPLETED` / `YOUR FIRST NEXT CHANGES THIS STAR.` No streak figures are shown at all, so no streak of 1 is implied before a completion exists.

**The planet and star still exist** in both cases — quiet, unlit versions of themselves.

## 12. Persistence and migration

No new persisted field, no schema change, no migration. Both features derive entirely from `history[].completedAt` and `history[].photoUri`, which existing devices already carry. `persistence.decode` is unchanged and still whitelists persisted fields. An existing user's figures appear correctly on first launch and nothing is wiped.

## 13. Performance impact

No second Canvas — both screens are plain React Native over the existing routes, and neither imports three. Added to the universe: one 32×22 sphere, one 26-point additive `points` (hidden when empty), and one extra uniform on each of the star and halo materials. No postprocessing, no bloom, no shadow maps, no new textures, no new particle system, and no per-frame allocation or React state. The star's response is arithmetic on values already being written each frame. The extra per-frame cost is a handful of uniform writes and one light-intensity assignment.

## 14. Accessibility

Both new bodies have the same generous 96×108 projected hit target as the existing three, labelled `MEMORIES` and `YOUR MOMENTUM`, with counts in their accessibility labels (`Memories, 3 photos preserved`; `Your momentum, 5 day streak, 12 completed`) and honest empty variants. Memory cards are buttons labelled with title and date. Memory's planet joins the existing rotation affordance, including its `adjustable` role and increment/decrement actions. The recent-days row is a single element with a spoken summary rather than fourteen unlabelled dots. Photos keep the existing alt text and their missing-file fallback.

Reduce Motion: the planet and its fragments stop drifting, the star keeps its brightness progression but loses the breath, pulse and flares entirely, and the Progress anchor stops pulsing.

## 15. Files created

`src/features/product/progress.ts`, `src/features/product/MemoryScreen.tsx`, `src/features/product/ProgressScreen.tsx`, `src/app/memory.tsx`, `src/app/progress.tsx`, `scripts/verify-momentum.cjs`, this report.

## 16. Files modified

`src/features/product/spaceShaders.ts` (momentum in the star and halo, new `memoryFragment`), `src/features/product/ProductScene.tsx` (Memory body and fragments, momentum response, two new focus targets), `src/features/product/ProductSpace.tsx` (five hit targets, third rotation, derived momentum), `src/features/product/Screens.tsx` (focus-then-depart for Memory and Progress).

## 17. Tests

`scripts/verify-momentum.cjs` covers the streak rule (empty, first completion, same-day, consecutive, alive-yesterday, broken, longest-anywhere, a run across the end of DST, corrupt and unfinished records, the 14-day window and its `before` marking, identical figures after a persistence round trip, and that no counter is persisted); the bounded star response (monotonic, never above its maximum, strictly rising across the range a real streak occupies); Memory sourcing (photos only, History intact, still counted in momentum, correct date formatting, and a real completion reaching the archive through the existing action); both screens rendered against mocked hooks (empty states, archive contents, detail with action, note and capsule, back navigation, derived figures, restrained copy); and the universe wiring.

Two mutations were checked to fail: replacing local-calendar day arithmetic with a fixed 24-hour offset breaks the DST case, and counting every completion toward the streak breaks the same-day case.

The full suite passes: TypeScript, `verify.cjs`, `verify-photos.cjs`, `verify-auth.cjs`, `verify-launch-routing.cjs`, `verify-momentum.cjs`, `verify-astronaut.mjs`, the development iOS export (GLB still bundled) and the web export (`/memory` and `/progress` emitted).

**Shader compilation was verified for real**, not just by inspection: all six vertex and fragment shaders, including the new `memoryFragment` and the modified star and halo, compile without error in a browser WebGL context.

## 18. Known limitations

- Shader compilation was checked against desktop WebGL 2 through ANGLE, not iOS GLES through Expo GL. Syntax is proven; driver-specific behaviour is not.
- Appearance, timing and performance are unverified on device. The preview pane in this session is hidden, so `requestAnimationFrame` never fires and the universe canvas cannot render or be photographed. The look of the Memory planet, the star's progression, the transitions and the frame cost are all physical-iPhone gates.
- Five labelled hit targets is one more than the composition previously carried. The labels remain the accessibility affordance, so they were kept, but whether the universe now reads as crowded on a phone screen is a judgement only the device can settle.
- The streak uses the device clock. Changing the device date changes the figures, which is correct for a local demo but is not tamper-resistant.
- The recent-days row is fixed at 14 days and does not scroll to earlier history.
- Memory has no lazy-loading or windowing; a device with a great many photos will hold them all in one scroll view.

## 19. Physical-iPhone test

Backend running, then stop Metro and start fresh:

```sh
npx expo start --lan --clear
```

**Memory**

1. Before completing anything with a photo, find the Memory world left of the hero star. Confirm it is dark and quiet, clearly not Today or History, and has no orbiting fragments.
2. Tap `MEMORIES`. The camera should focus, then the archive opens. Confirm the empty state reads `YOUR UNIVERSE REMEMBERS WHAT YOU LIVED.` with no placeholder cards. Return to the universe.
3. Complete a NEXT **with** a photo and an optional written memory. Confirm the existing 2.1-second submission is unchanged.
4. Open Memory again: the photo is the dominant object on the card, with the correct title and the completion date as `SEP 27, 2026`.
5. Tap the card. Confirm the larger photo, the title, `WHAT THIS NEXT ASKED` with the original action, your written memory, and any capsule sealed against that NEXT. Use both ways back.
6. Complete a NEXT **without** a photo. Confirm it appears in Previous NEXTs and does **not** appear in Memory.
7. Fully close and reopen Expo Go. Confirm the photos are still there after the entrance.
8. With at least one memory kept, look at the Memory planet again: stored light should now be visible under the surface and the fragment ring should be orbiting. Drag the planet to rotate it.

**Hero star**

9. On a device with no completions, tap `YOUR MOMENTUM`. Confirm `0 / NEXTS COMPLETED / YOUR FIRST NEXT CHANGES THIS STAR.` and that no streak figure is shown.
10. Complete one NEXT. Watch the light travel to the star and the star settle brighter. Open Progress: current 1, longest 1, total 1, and one lit point at the right-hand end of the recent-days row.
11. Complete a second NEXT the same day. Total rises to 2; the streak stays at 1.
12. Tap the star from several angles — the target is generous, so you should not need the bright core. Confirm a drag of the universe does not open Progress.
13. Over following days, confirm consecutive days extend the streak, a missed day resets current to 0 while longest is kept, and the connecting light joins only the live run.
14. Watch the star at a long streak: it should feel more alive but stay readable, never a white blob, with flares rare rather than constant.
15. Enable Reduce Motion and repeat: the star keeps its brightness but stops pulsing and flaring, the planet and fragments stop drifting, and both screens still open.

**Regression**

16. Opening cinematic, auth (dev `···` → `PREVIEW CREATE ACCOUNT · KEEP PROGRESS`), astronaut reveal, personalization, Gemini generation, Today, BEGIN → COMPLETE, History card and detail, Time Capsule, Journey and `I'VE MOVED FORWARD`, Today and History planet rotation.

## 20. git status

Modified: `app.json`, `metro.config.js`, `package.json`, `package-lock.json`, `src/app/index.tsx`, `src/app/universe.tsx`, `src/features/dev/cinematic/CinematicScene.tsx`, `src/features/dev/personalization/PersonalizationScene.tsx`, `src/features/dev/personalization/PersonalizationScreen.tsx`, `src/features/experience/ExperienceProvider.tsx`, `src/features/experience/model.ts`.

Untracked: `.env.example`, `assets/astronaut/`, `docs/`, `scripts/`, `server/`, `src/app/auth.tsx`, `src/app/dev/reset.tsx`, `src/app/journey.tsx`, `src/app/memory.tsx`, `src/app/progress.tsx`, `src/app/reflect.tsx`, `src/features/astronaut/`, `src/features/product/`.

No dependency was added and `package.json` was not touched in this pass. Nothing committed, nothing pushed.
