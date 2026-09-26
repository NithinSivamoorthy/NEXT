# NEXT
Build your universe, one NEXT at a time.

## Development

Install dependencies with `npm install`, then start the Expo development server:

```sh
npm run start
```

Use `npm run ios`, `npm run android`, or `npm run web` to open a specific target.

## Isolated universe prototype

The universe destination renders a procedural hero star and a seeded 3D star field.
Checkpoint 3 adds a pre-universe flow; progression rules are not implemented.

- **iPhone / Android:** drag with one finger to orbit; pinch to zoom. Camera pitch
  and distance are bounded, with damping and short release inertia.
- **Web:** drag to orbit; pinch or scroll to zoom. Arrow keys and `+` / `-` also work.
- The scene pauses when the app is inactive. Reduce Motion disables passive
  animation and release inertia.
- The text overlay uses the existing safe-area support.

### Expo Go on your existing iPhone

The packages are compatible with the Expo SDK 57 native modules included in
Expo Go. Keep using the SDK 57 Expo Go installation that already runs this app.
After pulling/installing packages on another machine, use `npm ci`.

For an already running Metro server, reload the app from the Expo Go developer
menu (shake the phone), or press `r` in the existing server terminal. If Metro
cannot resolve a newly added package, stop that server and restart it with:

```sh
npm start -- --clear
```

Keep the phone and computer on the same network and scan the server's QR code.
Check drag, pinch, adding/removing a second finger, both zoom limits, and
backgrounding/reopening the app. Inspect sustained performance on the real
phone; a successful bundle or browser preview does not establish native FPS.

### Rendering structure

`src/features/universe/` contains the isolated implementation:

- `model.ts`: fixed seed, hero identity, and generated star buffers.
- `camera.ts`: platform-independent gesture targets, bounds, and camera damping.
- `shaders.ts`: texture-free stellar surface, corona, and point-star materials.
- `UniverseScene.tsx`: shared Three.js scene and frame updates.
- `UniverseCanvas.tsx`: Expo GL / Fiber native adapter and core RN touch responders.
- `UniverseCanvas.web.tsx`: browser Canvas and pointer input adapter.
- `UniverseScreen.tsx`: safe-area overlay, lifecycle, Reduce Motion, error boundary.

Runtime versions are pinned: Fiber 9.8.0, Three.js 0.186.1, Expo GL 57.0.2,
Expo Asset 57.0.18, Expo File System 57.0.7. Three.js types are 0.186.0.
No Gesture Handler or Reanimated API is used by the prototype.

The scene uses three draw calls: a 3,200-point star field, one sphere (about
5,000 triangles), and one corona plane. It uses no downloaded textures, shadows,
or post-processing pipeline. Native Canvas uses device resolution; browser DPR
is capped at 1.5. Future object selection can use Three.js raycasting after tap
recognition, and future progression can supply stable scene data separately.

### Checks

```sh
npm run typecheck
npx expo install --check
npx expo export --platform web
```

Expo's online dependency metadata currently recommends TypeScript `~6.0.3`,
while this foundation uses `5.9.3`. The offline dependency check passes but does
not validate TypeScript against that online recommendation. The prototype
preserves the existing compiler version. Checkpoint 2 was verified by the user
on a real iPhone; sustained thermal behavior remains a device-level check.

## Checkpoint 3: core experience

The home route now starts the pre-universe flow:
launch → entry → philosophy → five questions → local personalization → first
NEXT → universe narrative → the existing interactive universe.

- `src/features/experience/model.ts`: typed answers and session reducer.
- `ExperienceProvider.tsx`: in-memory session, accessibility and app activity.
- `content.ts`: centralized onboarding copy, choices and narrative frames.
- `personalization.ts`: deterministic local first action behind an abortable async
  interface. No external service is contacted.
- `ui.tsx`, `CinematicSequence.tsx`, `QuestionScreen.tsx`, `FlowScreens.tsx`:
  shared mobile layout, motion, questions and flow screens.
- Routes: `/`, `/entry`, `/philosophy`, `/onboarding/[step]`, `/personalizing`,
  `/first-next`, `/universe-intro`, `/universe`.

Answers survive Back navigation within the session. Reload resets the session;
there is no persistence. The universe has a **development-only Replay intro**
control. Timed text becomes manually advanced when a screen reader is enabled.
Reduce Motion removes fades and translation; backgrounding pauses sequences.

### Checkpoint 3 physical iPhone acceptance

Start with `npm start -- --clear` (stop the old Metro process first), scan its QR
code with the existing SDK 57 Expo Go installation, and reload if necessary.

1. Watch the black launch, wordmark and tagline; tap Begin on entry.
2. Watch both philosophy frames. Answer all five questions, checking multiline
   keyboard layout and that blank answers cannot continue.
3. Go Back and confirm earlier answers and selected choices remain intact.
4. Finish onboarding. Check the brief loading moment and first NEXT. Try different
   text, time budgets and challenge levels across replays.
5. Tap Enter my universe, watch the narrative, and confirm the existing star
   renders. Test drag, pinch, inertia, limits and sustained interaction.
6. Background/reopen during the intro and in the universe. Repeat with iOS Reduce
   Motion, larger text and VoiceOver enabled.
7. Tap Replay intro in development, or reload Expo Go, to start again.

The user verified Checkpoint 2 on a physical iPhone. Checkpoint 3's full native
flow, keyboard, accessibility and return to the universe require device testing;
TypeScript, exports and browser checks cannot establish native acceptance.

Design deliberately uses system typography, core React Native animations and
restrained procedural UI marks. No astronaut model, final design assets,
authentication, AI, completion or universe progression is included.
