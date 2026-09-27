# NEXT — presentation vertical slice

## What is implemented

Normal `/` launch hydrates local state before choosing a route:
- New user: approved 4C.3 cinematic → interactive light → first reflection → approved consequence.
- First reflection already submitted: `/reflect`, resuming the first unanswered question.
- Personalization finished: `/universe`, without replaying onboarding.

The remaining questions use the existing `questions` array and fields: `movingFrom`, `reason`, `progressVision`, `dailyCommitment` (5/15/30/60), and `challengeLevel` (gentle/balanced/push). Back preserves answers; text inputs reject blank answers and cap input at 2,000 characters. No new questionnaire or bespoke question cinematics were added.

The production bridge reuses `PersonalizationScreen`, `PersonalizationScene`, `CinematicScene`, the first consequence and temporary astronaut. Opening timings, travel profile and consequence math are unchanged. Optional initial scene time reconstructs the quiet final composition for questions and returning users. Existing standalone universe/hero shaders remain untouched.

## Product loop

1. Finish personalization; `FORMING YOUR NEXT` appears while the request is pending.
2. Enter the spatial universe. A warm circular body represents **Today's NEXT**; a blue faceted body represents **Previous NEXTs**.
3. Tap Today to read title, action, why, duration and category.
4. Begin persists `active`; Complete moves the record into history and clears Today.
5. The history object emits a restrained ring response; a permanent light appears near it. The number of completed records reconstructs the lights on reopening (visual lights capped at 32; history remains complete).
6. History lists title, action, category, duration and completion date.
7. Empty Today optionally generates another NEXT using the same pipeline. Local fallback is deterministic and can repeat the same step; there is no scheduling or novelty engine.

Lifecycle: generated → available → active → completed/history. Duplicate completion is rejected by the reducer. No timers, XP, streaks or gamification.

## Persistence

Native uses the already-installed Expo File System `File`/`Paths.document` API. Two `next-state-0.json` / `next-state-1.json` slots contain versioned state and a monotonic revision. On startup both are parsed and validated; the newest valid slot wins. A failed/interrupted write leaves the previous slot available. Both invalid/missing slots start a new experience. Web uses equivalent localStorage slots.

Saved data: answers, first-consequence flag, onboarding completion, current NEXT/status, completed history, timestamps, generation source and IDs. History count reconstructs persistent celestial evidence. Reset writes empty state to both slots. Save failures show a retry notice. This is device-local, unencrypted app storage, not a cloud account or cross-device backup. Clearing Expo Go app data removes it.

## Gemini architecture and security

A dependency-free Node HTTP server handles `POST /next`; only this server reads `GEMINI_API_KEY`. Client receives structured content only. There is no key in Expo source or `EXPO_PUBLIC_*` variables. `EXPO_PUBLIC_NEXT_API_URL` is only the non-secret server address.

The server validates bounded input, limits request bodies to 24 KiB, applies a per-address request limit (12/minute), restricts browser origins, has an upstream timeout, returns generic errors, and does not log answers, keys or model response bodies. The development server is intended for trusted local Wi-Fi only. It is not an authenticated public service; do not deploy/expose it publicly without access controls, HTTPS and durable rate limiting.

Model: `gemini-3.5-flash-lite`, configurable with server-only `GEMINI_MODEL`. Official documentation checked September 27, 2026:
- https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
- https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- https://ai.google.dev/gemini-api/docs/api-key

REST uses `v1beta/models/{model}:generateContent`, the `x-goog-api-key` header, and `generationConfig.responseFormat.text` with the REST MIME enum `APPLICATION_JSON` and a JSON schema. Answers are separate user data; system instructions ask for bounded, specific, non-judgmental actions with no diagnosis or invented personal facts.

Structured fields:

| Field | Validation |
| --- | --- |
| title | Nonempty, ≤120 characters |
| action | Nonempty, ≤1,200 characters |
| why | Nonempty, ≤600 characters |
| estimatedMinutes | Integer, 1–user's daily commitment |
| category | Nonempty, ≤60 characters |
| reflection | Nonempty, ≤300 characters |

The server rejects incomplete/blocked/invalid output. The client validates again before creating/storing a NEXT. Client lifecycle metadata is generated locally, never trusted from Gemini.

Fallback reuses `buildLocalNext`: screen use, connection, work/procrastination or a general small-space action. Duration respects the user's time and challenge level. The reason is connected to the supplied answer. Missing URL/key, offline network, non-2xx, malformed output, invalid structure and timeout all produce a valid local NEXT without raw errors. Client timeout is 10 seconds; server upstream timeout is 8.5 seconds. Generation cancellation on unmount does not store a late result.

## API-key setup — user action required

No real key has been supplied, written or tested. The live Gemini call is the remaining secret gate.

1. Obtain a Gemini API key at https://aistudio.google.com/apikey.
2. In `/Users/nithinsivamoorthy/Documents/NEXT`, create the ignored files without replacing any existing files:

   ```sh
   cp -n server/.env.example server/.env
   cp -n .env.example .env
   ```

3. Edit **server/.env locally**, setting `GEMINI_API_KEY` to your key. Keep it out of chat, source and public variables. `server/.env` and `.env` are confirmed gitignored. `HOST=0.0.0.0` in the example makes the local server reachable from your iPhone on trusted Wi-Fi. Use a restricted key/quota appropriate to your presentation.
4. Find your Mac's Wi-Fi address:

   ```sh
   ipconfig getifaddr en0
   ```

5. Set the non-secret client address in `.env`:

   ```dotenv
   EXPO_PUBLIC_NEXT_API_URL=http://YOUR_MAC_WIFI_IP:8787
   ```

6. Terminal one:

   ```sh
   npm run server
   ```

7. Terminal two — stop any older Metro process first:

   ```sh
   npx expo start --clear --lan
   ```

8. Verify `http://YOUR_MAC_WIFI_IP:8787/health` is reachable from iPhone Safari and reports `configured: true`; do not send the key from the phone. Then scan Expo's QR code using iPhone Camera and open Expo Go.

For web development, default allowed origins are `http://localhost:8081` and `http://localhost:8083`. Set `ALLOWED_ORIGINS` in server/.env if using a different origin. Restart the server after changing its environment; restart Metro after changing public variables. Node 22+ is recommended for the start command; implementation was tested with Node 24.21.0.

**No-key presentation:** leave `EXPO_PUBLIC_NEXT_API_URL` absent/blank. Run only `npx expo start --clear --lan`. The complete app loop works with local generation.

## Physical-iPhone acceptance checklist

1. Mac and iPhone on the same Wi-Fi. Run the Metro command above; open its QR in Expo Go. Open the root app, not a dev route.
2. First launch: check approved title/slogan/travel/astronaut opening, then tap the light.
3. Enter reflection; submit to the light. Check first consequence, then remaining existing questions.
4. Check keyboard visibility, blank validation and Back preservation. Finish all five answers.
5. Tap Today's NEXT; verify actionable content and correct time allowance. Begin.
6. Close/reopen Expo Go. Confirm direct universe restoration and Today still **IN PROGRESS**.
7. Complete NEXT. Confirm response/light, dimmed Today and one History item.
8. Open Previous NEXTs and read the completed action/date.
9. Close/reopen again. Confirm completed history/light remain and onboarding does not replay.
10. Optionally generate another NEXT. Stop the backend or disconnect network to verify fallback.
11. Test with iOS Reduce Motion and VoiceOver. Verify no aggressive travel under Reduce Motion, readable labels and targets, and scrolling with larger text.
12. For another full demo: the subtle `···` on universe opens development controls; choose Reset & Replay and confirm. This clears this device's test progress. `/dev/reset` is development-only.

The physical iPhone remains the acceptance gate for Expo GL rendering, native storage, keyboard behavior, frame pacing and memory. Exports/browser checks do not prove those.

## Accessibility, performance and recovery

Preserved opening VoiceOver/Reduce Motion behavior. New screens provide headings, labeled ≥44-point actions, 96-point celestial targets, radio selected states, scrolling text and keyboard avoidance. Completion is announced. Text remains native UI; shader text was not introduced. Reduced Motion suppresses the completion pulse. App background/focus pauses rendering; unfocused product scenes unmount their Canvas. No post-processing, shadow maps, physics or extra particle fields. Two low-poly bodies plus up to 32 tiny permanent lights are added to the existing scene.

3D render failure gives readable recovery: continue personalization without the opening renderer; Today/History targets remain accessible if the product renderer fails. Error boundaries cannot recover an Expo/native process crash. No actual GPU-failure injection or physical-device test has been performed.

Astronaut, celestial bodies and lighting remain prototype assets. Live Gemini content remains unverified until key setup. Older development/legacy routes remain available but are not the normal launch flow. Web is secondary; no SSR redesign was attempted.

## Verification performed

- `npm run typecheck`: passed.
- `node scripts/verify.cjs`: passed; covers existing answers, all local duration/challenge combinations, available/active/completed lifecycle, duplicate completion protection, active/history restoration, invalid-state rejection, reset, valid mocked Gemini, malformed/offline/non-2xx/timeout fallback, cancellation and server request/response contract.
- `EXPO_OFFLINE=1 npx expo install --check`: reports dependencies up to date, with offline-validation reliability caveat.
- iOS export: passed, output in `/tmp/next-vertical-ios`.
- Web static export: passed, output in `/tmp/next-vertical-web`.
- Live browser: full first reflection → all remaining questions → local NEXT → Begin → reload active state → Complete → History → root relaunch restores completed state. Back preserves answers, blank validation works. Inspected 390×844 layout.
- Local HTTP: `/health` 200 with configured false; invalid input 400; valid input with no key 503; disallowed browser origin 403.
- Known warnings: Three.js CommonJS/Clock deprecations, React Native Web pointerEvents deprecation, NO_COLOR/FORCE_COLOR conflict. No runtime errors observed in the tested live browser loop.
- Early typecheck errors from an unavailable navigation import and stale generated route types were resolved. Sandboxed local port access initially failed; local servers/checks succeeded with approved host permissions.
- No real Gemini request or physical-iPhone test performed.

## Files / dependency discipline

Created:
- `.env.example`
- `server/.env.example`
- `server/gemini.mjs`
- `server/index.mjs`
- `scripts/verify.cjs`
- `src/app/reflect.tsx`
- `src/app/dev/reset.tsx`
- `src/features/product/next.ts`
- `src/features/product/persistence.ts`
- `src/features/product/storage.ts`
- `src/features/product/storage.web.ts`
- `src/features/product/ui.tsx`
- `src/features/product/ProductSpace.tsx`
- `src/features/product/Screens.tsx`
- `docs/VERTICAL_SLICE.md`

Modified:
- `package.json`: added `server` script only; no dependency/version changes.
- `src/app/index.tsx`: persisted-state launch decision.
- `src/app/universe.tsx`: product universe route.
- `src/features/experience/model.ts`: lifecycle, history and restore actions/fields.
- `src/features/experience/ExperienceProvider.tsx`: hydrate/save/retry.
- `src/features/dev/cinematic/CinematicScene.tsx`: optional initial clock for restored composition; default unchanged.
- `src/features/dev/personalization/PersonalizationScene.tsx`: optional children for purposeful objects.
- `src/features/dev/personalization/PersonalizationScreen.tsx`: optional production callbacks/recovery, first-answer length bound, focus-aware Canvas; the web submit button stays mounted after blur so its press can complete (native submit behavior unchanged). Existing dev defaults/timings retained.

No dependency installation. Package lock, Metro, app config, original universe/hero, typography audition and approved timing/consequence modules are unchanged. No commits or pushes.


## Deadline Gemini connectivity fix

The initial raw REST request incorrectly sent `responseFormat.text.mimeType: "application/json"`. The actual Gemini API rejected it with HTTP 400 / INVALID_ARGUMENT; the backend returned HTTP 503 and the client used its non-2xx fallback. The REST field requires `APPLICATION_JSON` (SDK-style MIME strings are not accepted in this field). Corrected without changing the model, credentials, dependencies, homepage or environment files.

Client environment access was already correct static dot notation. The existing local-generation log only occurred after an exception, not when the URL was missing. Backend silence was inconclusive because it previously had no per-request logs.

New development logs show the resolved non-secret URL, outgoing target, explicit Gemini success, and safe missing-URL/network/timeout/HTTP/JSON/schema failure reasons. Backend logs request arrival, final status and safe upstream HTTP failure classification; no answers, keys or headers are logged.

Verification after this fix (supersedes the initial no-key verification above):
- Real Gemini call using unchanged local credentials/model `gemini-3.5-flash-lite`: HTTP 200, validated structured output.
- Actual backend `POST http://127.0.0.1:8787/next`: HTTP 200 through Gemini.
- Actual client function using `http://10.10.9.161:8787/next`: Gemini source; intentionally unreachable port: local fallback.
- TypeScript, regression tests and development iOS export passed.
- Export contains the exact configured LAN URL. Exact-key comparison found no key in export or tracked files; the comparison never printed the key.
- Physical-iPhone bundle execution still requires retesting; its earlier precise exception was not captured. The server-side request defect was directly reproduced and fixed.

Retest: restart `npm run server`, restart Metro with `npx expo start --lan --clear`, reopen Expo Go, and generate a NEW NEXT. Existing persisted local NEXTs are not automatically regenerated. Complete the current one and use Generate Another NEXT, or use development reset if replay is wanted. Observe the backend received/succeeded/HTTP 200 logs and client `NEXT: using Gemini generation.`. No new key setup is required.
