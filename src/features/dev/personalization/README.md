# Checkpoint 4C.3 — First consequence

The physically approved 4C.2.2 opening, travel, discovery, ignition, cue and input
remain the baseline. All shared cinematic files, travelProfile.ts and presentation.ts
are unchanged. This checkpoint begins only after valid first-answer commitment.

## New endpoint

The original star receives the reflection, contracts/pulses, and organizes 14 local
fragments into incomplete tilted paths. It remains the seed. No planet, label,
floating answer, second question, success screen, navigation or additional controls.
The settled scene contains the original star, local proto-structure and astronaut.
The answer is not interpreted or used to seed geometry; positions are deterministic.

| Time after valid commit | Event |
| --- | --- |
| 0–0.30s | Native question/input fade; keyboard dismisses; semantic input disabled |
| 0.35–0.70s | Slight star contraction; surrounding space remains quiet |
| 0.70–1.10s | Concentrated pulse; contraction releases |
| 0.90–1.55s | Local matter becomes perceptible and gathers inward |
| 1.15–2.70s | Matter separates into varied inclined trajectories |
| 2.50–3.50s | Intensity settles; structure remains |
| 3.50s onward | Persistent quiet local system, very slow fragment motion |

The pulse fades completely by 1.3s. The astronaut notices formation with an extra
0.09 radian (~5.2 degree) roll, eased over 1.5–3.5s after commit. No translation,
camera movement, head gesture, lighting change or congratulation. Its original
pre-commit orientation behavior remains exactly as approved.

## Spatial construction and cost

FirstConsequence.tsx owns one Points draw (14 vertices) and one lineSegments draw
(70 segments / 140 vertices), two lightweight ShaderMaterials. Short tapered traces
cover only 0.08–0.15 radians per fragment, never complete rings. Varied radii
0.65–1.34 world units, eccentricity, inclination, yaw, brightness, size and angular
speeds of 0.015–0.039 rad/s give depth; settled initial depth span is ~1.22 units.
The local structure shares the original star's world-space center and camera,
so its foreground/background pieces have perspective and spatial parallax.

No shared-star mutation hook was added: all original 700 stars stay unchanged.
Only 14 local fragments emerge from the darkness, avoiding a general particle
system or pre-commit change to the locked baseline. Buffers and scratch coordinates
are reused. There are no per-frame React updates. No textures, shadows, physics,
post-processing, external models, assets, packages or additional GL contexts.

## State / accessibility

Existing isolated ExperienceState/reducer still stores trimmed movingFrom.
Whitespace is rejected. answerCommitCount gates one consequence. A new `settled`
phase fires once after the foreground-time deadline. Backgrounding pauses the
controller and renderer; the current formation, committed answer and final system
survive resume. Keyboard events do not reset the session. Replay remounts/reset;
Exit discards it. No disk/cloud persistence or competing answer schema.

All Animated graphs remain JS-driven, including the new 300ms question fade.
Input is immediately inert/hidden from accessibility after commit, then unmounted
when settled. Canvas/fragments remain decorative. VoiceOver announces exactly once
at settle: `Your universe has changed.` No per-fragment or intermediate narration.

Reduce Motion: 180ms text fade, quiet to 0.6s, then opacity/contrast reveal of the
already-settled static structure through 1.4s. No contraction, pulse, orbit gathering,
ongoing orbital motion, extra astronaut roll or camera movement. One announcement
occurs at the 1.4s settled phase. Same answer and persistent outcome.

## Verification / physical gate

TypeScript, development iOS/web exports, state/geometry/driver diagnostics, browser
flow and route regression checks supplement (not replace) physical iPhone acceptance.
Diagnostics cover whitespace, one commit/formation, background pause/resume mid-event,
state persistence/reset, static reduced positions, finite deterministic geometry,
noncoplanar depth, all four Animated timing drivers false, and locked-file hashes.

Run `npx expo start --lan --clear` and open the Expo Go address with
`/--/dev/personalization`. Commit an answer and watch the first 3.5 seconds; confirm
star continuity, local spatial formation, restrained astronaut attention, and a
quiet persistent endpoint. Test repeated input, background during/after formation,
Replay, VoiceOver, Reduce Motion, and sustained iPhone rendering. No question 2.
The astronaut remains TEMPORARY. Stop at 4C.3; no commits or pushes.

Verification note: the live Expo browser route renders the consequence. A direct
preview of the exported development HTML exposed a hydration mismatch in the
pre-existing title layout (server zero dimensions versus browser viewport).
That static-preview issue is reported rather than changing the locked opening.
No physical iPhone or VoiceOver performance/behavior claim follows from exports.

---

# Historical 4C.2.2 — Animated ownership and readable opening

This section supersedes timing/animation details in the historical 4C.2.1 notes
below. No travel/star/astronaut visual redesign, answer-model change or scope expansion.

## Native error diagnosis and ownership

The previous native `questionOpacity` timing shared an Animated.View style with
JS `typingProgress` top/height interpolations. Installed React Native's
AnimatedStyle.__makeNative promotes all nodes in that style, and
AnimatedInterpolation.__makeNative promotes its parent. This promoted the typing
value and its fontSize/lineHeight branches too. Native style validation rejected
those four properties; the next JS typing animation rejected the native-owned
value. Separate variable names did not provide separate graph ownership.

All screen Animated values now remain JS-owned for their entire lifetime:

- questionOpacity: JS timing, 550ms (zero Reduce Motion).
- typingProgress: JS timing, 220ms (zero Reduce Motion). Owns translateY, height,
  fontSize, lineHeight and compact-question opacity interpolations.
- instructionOpacity: JS timing, 250ms (zero Reduce Motion).
- opacity (NEXT), slogan, sloganSettle: JS setValue from the scene title callback.
- targetPosition and instructionPosition (including both XY components): JS
  setValue from projection. No native Animated.event or native-driver timing.

Top is static; movement now uses translateY. Height and text metrics remain JS
interpolations to preserve the approved composition. Keyboard.scheduleLayoutAnimation
is a separate layout API and owns none of these Animated values. No error suppression.
Fully reload Expo Go after updating: Fast Refresh can retain previously promoted refs.

## Opening and absolute timing

A default-zero `openingHold` prop in CinematicScene pauses its journey clock before
approach, at 1.25s normal / 2s reduced motion. Only personalization sets it to 2.4s.
The existing onTime callback also receives raw foreground seconds for the slogan,
so the slogan continues while the journey/title opacity clock waits. Baseline
/dev/cinematic retains zero hold and ignores the additional callback argument.

| Normal-motion milestone | 4C.2.1 | 4C.2.2 |
| --- | --- | --- |
| NEXT reveal | 0.5–1.25s | 0.5–1.25s |
| Slogan entrance | 0.625–1.0625s | 1.65–2.15s |
| Slogan fully readable hold | 1.0625–2.0625s | 2.15–3.75s |
| Slogan exit | 2.0625–2.3125s | 3.75–4.15s |
| NEXT letter exit | 2.3125–3.3125s | 4.7125–5.7125s |
| Approach begins | 3.2s | 5.6s |
| Cross point center (distance 14) | ~6.491s | ~8.891s |
| Peak velocity | ~8.460s | ~10.860s |
| Travel ends / discovery begins | 11s | 13.4s |
| Astronaut fully lit | 13.75s | 16.15s |
| Hold callback | 14.25s | 16.65s |
| Star ignition | 14.70s | 17.10s |
| Approximate star settled appearance | 15.15s | 17.55s |
| Instruction starts / fully shown | 15.95 / 16.20s | 18.35 / 18.60s |

The slogan now has a 1.6s full-opacity reading hold and a 0.5625s NEXT-only
consolidation after its exit. Wording, Space Grotesk styling and safe-area placement
are unchanged. No secondary slogan introduced. All later pacing is exactly the
previous journey shifted +2.4s; peak velocity remains ~205.52 units/s, discovery
2.75s, star/cue timing relative to arrival unchanged.

Reduce Motion keeps the restrained path: NEXT reveal 0.8–2s; slogan in 2.4–2.9s,
held to 4.5s, out by 4.9s; letters fade 6.1–7.7s. Discovery 18.4–21.15s, ignition
22.1s, cue 23.35s. Slogan has no translation, question/typing/cue timings are zero.

## Verification boundary

TypeScript, iOS/web development exports, explicit driver AST audit, title-order
and post-opening offset diagnostics, answer-state invariants, and browser regression
checks supplement device testing. They cannot establish the absence of native
runtime errors on a physical iPhone. Retest a cold reload through question reveal,
focus/blur/repeated keyboard opening, commit, Replay, background/resume, VoiceOver,
Reduce Motion and large text. The fixed-world/small-keyboard occlusion limitation
from 4C.2.1 remains; the native typing composition itself is preserved.

---

# Historical 4C.2.1 — iPhone pacing / presentation polish

Isolated at `/dev/personalization`. The first `movingFrom` answer still commits
through the existing reducer into development-only state; one lasting brighter
star is the endpoint. Replay resets it. No production answers or files change.

## Nominal foreground timing (normal motion)

| Event | 4C.2 | 4C.2.1 |
| --- | --- | --- |
| Unchanged entry interval | 0–6.5s | 0–6.5s |
| Approach starts | 3.2s | 3.2s |
| Travel stops / astronaut discovery starts | 11.5s | 11s |
| Astronaut fully lit | 15.5s | 13.75s |
| Discovery duration | 4s | 2.75s |
| Hold callback | 16.5s | 14.25s |
| Star ignition begins | 18.5s | 14.70s |
| Ignition envelope reaches full base | +280ms | +120ms |
| Brief ignition peak | +320ms | +160ms |
| Approximate settled appearance, including smoothing | +800ms | +450ms |
| Fallback instruction begins | 20.70s | 15.95s |
| Fallback instruction fully shown | 21.15s | 16.20s |
| Peak velocity | 177.773 units/s at 8.661s | 205.520 units/s at 8.460s |

Frame deltas are capped at 50ms; low frame rates/background pauses extend wall
clock durations. Star luminance is exponentially smoothed, so its settled time
is approximate, not a separate hard visibility switch. The instruction begins
about 0.8s after settled appearance. An earlier tap permanently suppresses it.

Reduce Motion skips the aggressive travel clock. Discovery is 16–18.75s, hold
19.25s, ignition 19.70s with a 300ms fade and no flare, instruction 20.95s.

## Shared renderer boundaries

`CinematicScene.tsx` adds optional `energeticTravel`, `discoveryEnd`, and `holdAt`
props. Defaults retain `/dev/cinematic`'s previous behavior. Only personalization
opts in. Cinematic timeline, point-boundary shader, and proxy model are untouched.
The camera remains solely owned by CinematicScene. No keyboard values reach it.

Travel still uses 700 seeded stars and existing Points/lineSegments draws. Every
fourth star uses 38% of the broad XY volume, giving 175 nearer lateral passes;
depth remains uniformly distributed over 180 world units. It is a rectangular
volume, not a central cone or radial pattern. The remaining 525 retain the broad
field. Opt-in point motion intensity uses 2.1x the velocity term; trails use 2.6x.
Low-speed point brightness remains 0.55 and trails reach zero as velocity stops.
Trail length varies by seeded weight, view depth and velocity, capped at 11 world
units versus 4.2 previously. No additional travel particles, overlays or passes.

The interactive star is one shader point: 12 logical pixels of total support,
with an approximately 2–3px concentrated core, low-amplitude falloff and faint
axial scatter. Stable intensity rises from 0.92 to 2.4, and a fast one-time flare
replaces the gentler ignition. There is no disk geometry, texture, bloom plane,
pulsing loop, or second light body. The existing answer consequence remains once.

## Primary title slogan

Exact text: `BUILD YOUR UNIVERSE,\nONE NEXT AT A TIME.`
Bundled Space Grotesk Bold, 12pt / 20pt line height, 1.4 tracking, warm off-white.
Centered with 40pt beyond the bottom safe inset (minimum bottom offset 56pt).
Native text scaling/wrapping remains enabled. It is a semantic text block, never
an automatic announcement. No secondary/philosophy slogan was introduced.

Using the original title clock, normal-motion slogan entrance is 0.625–1.0625s;
exit is 2.0625–2.3125s, before the NEXT letters fade. A maximum 3pt vertical settle
accompanies opacity. Reduce Motion uses opacity only (1–1.7s in, 3.3–3.7s out).
The opening duration is unchanged. iPhone readability is an acceptance check.

## Typing composition and overlap diagnosis

Previously there was no focused-entry composition: full-size question and input
shared a fixed 40%-height region, and keyboard screen coordinates were used as
local coordinates. Native keyboard occlusion is separate from text-layer overlap.

The new native layer measures its window origin, safe inset, keyboard frame, and
actual star projection (once per viewport). It ends 62pt above the star target or
16pt above the keyboard, whichever is higher. Focus animates the layer upward to
safe-top + 8, compacts Clash from 26/32 to 19/23, reduces its opacity to 72%, and
prioritizes editable Inter text. The transition takes 220ms, zero with Reduce
Motion. Keyboard dismissal restores the resting state. A ScrollView keeps large
text and the small semantic send action reachable; the input scrolls internally.

Canvas stays full-screen. Astronaut position, scale, lighting direction and subtle
orientation behavior are unchanged. The OS keyboard can still cover lower scene
content on very short devices; this cannot be eliminated solely by moving text
while keeping the camera, scene and keyboard fixed. Physical-iPhone verification
is required before claiming that constraint is satisfied on every keyboard size.

## Accessibility, performance, checks

VoiceOver labels, native input, question focus, semantic submit, and one-time
commit announcements remain. Keyboard/web supports Enter/Space on star, Return
submit, Shift+Return multiline editing, and Escape blur. Reduce Motion preserves
all semantics with restrained contrast and no aggressive travel/orientation.

One Canvas; original 700 stars; one extra star point/material; no new assets,
dependencies, textures, post-processing, shadows, or GL contexts. Animation lives
in refs/uniforms/Animated values. React receives meaningful phases, editing,
keyboard/layout changes, and one star projection per viewport, not frame values.

Verify with `npm run typecheck` and development iOS/web exports. Diagnostics cover
state invariants, clock continuity, cue suppression, slogan envelope, and layout
bounds at 568/667/736/844/932px heights. Browser checks do not verify native keyboard,
VoiceOver, system large text, sustained GPU performance, or subjective travel feel.

Start: `npx expo start --lan --clear`; open the Expo Go LAN address with
`/--/dev/personalization`. Test title readability, peak travel, recognition/ignition,
early tap, cue timing, keyboard open/dismiss, long text, send/Return, single lasting
consequence, Replay, background, VoiceOver, Reduce Motion and larger text.

Stop at 4C.2.1. The astronaut remains TEMPORARY. Nothing is committed or pushed.
