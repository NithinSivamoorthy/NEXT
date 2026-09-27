# NEXT.

**Build your universe, one NEXT at a time.**

NEXT helps people who know where they want their life to go but cannot see the next meaningful action. It turns personal context into one small step, then makes completed steps visible in an evolving 3D universe.

Built for **ShellHacks**. using the help of codex code generation.

## How it works

A cinematic arrival leads into a local demo identity and five personalization questions. NEXT generates an action sized to the time and challenge level you choose. Begin it, do it in real life, and mark it complete. Each completion becomes part of your universe: a record in Previous NEXTs, possible photo memory, and momentum reflected in the Hero Star. Your astronaut's Journey brings your starting point, completed actions, and chosen direction together.

## Explore the universe

| Destination | What you find |
| --- | --- |
| **Today's NEXT** | One actionable step, its reason and estimated time; begin, complete, or generate another after completion. |
| **Previous NEXTs** | Completed actions, dates, and any optional written memories or photos. |
| **Memories** | A gallery of completed NEXTs with photos. Photo attachment is available in the iOS and Android apps; completion works without one. |
| **Your Momentum / Hero Star** | Total completions, current and longest daily streaks, recent activity, and Time Capsules. The star responds to momentum. |
| **Astronaut / Your Journey** | Your local identity, original answers, current step, completed steps, and a personal recap. |

You can write a **Time Capsule** to your future self from the momentum screen or after completing a NEXT. It stays sealed until you choose **I've moved forward** in Journey; the capsules present at that moment become readable. The universe supports orbit and zoom, and its Today, History, and Memory worlds can be rotated when focused.

### Why a universe?

A checklist records that something happened. NEXT gives each action a place and a visible consequence: completed steps leave lights, photos gather into Memories, and the Hero Star changes with your momentum.

## Gemini integration

```text
Expo app → NEXT Node backend → Gemini API
         ← validated, structured NEXT ←
                   ↓
       local progress + 3D universe
```

The app sends the five onboarding answers (starting point, reason, desired progress, daily time, and challenge level) to the configured NEXT backend. The backend calls Gemini, validates a structured response, and returns one NEXT. **`GEMINI_API_KEY` stays on the backend**; it is never placed in an Expo public variable. If the endpoint is absent or generation fails, the app creates a deterministic local NEXT from the answers. A generated record stores whether it came from Gemini or the local fallback.

## Tech stack

- **Client:** React Native, Expo SDK 57, Expo Router, TypeScript
- **Universe:** Three.js, React Three Fiber, Expo GL on native, browser canvas on web
- **Backend:** Node.js HTTP server and Gemini API
- **Local data:** Expo FileSystem on native; browser `localStorage` on web
- **Photos:** Expo Image Picker and local native document storage

## Run locally

Use **Node.js 22 or newer** and npm. Install dependencies from the repository root:

```sh
npm install
cp .env.example .env
cp server/.env.example server/.env
```

Set `GEMINI_API_KEY` in `server/.env` to use Gemini. Keep this file private. Then set `EXPO_PUBLIC_NEXT_API_URL` in the root `.env` to the backend's base URL (without `/next`). For an iOS simulator or local browser, `http://localhost:8787` is a typical value. For a physical phone, use your computer's reachable address on the same trusted Wi-Fi network. The public Expo variable contains only the backend URL, **never an API key**.

Start the backend and Expo in separate terminals:

```sh
npm run server
npm run start
```

From the Expo terminal, open an iOS simulator or scan the QR code with a compatible Expo Go installation. You can also start a target directly:

```sh
npm run ios
npm run web
```

`npm run android` is also defined. The backend's `GET /health` endpoint reports whether a key is configured. Without the backend URL or a working Gemini request, the client still generates a local NEXT.

### Environment variables

| File | Variable | Purpose |
| --- | --- | --- |
| Root `.env` | `EXPO_PUBLIC_NEXT_API_URL` | Optional client-visible backend base URL. |
| `server/.env` | `GEMINI_API_KEY` | Server-side key required for Gemini generation. |
| `server/.env` | `GEMINI_MODEL` | Optional Gemini model override. |
| `server/.env` | `HOST`, `PORT`, `ALLOWED_ORIGINS` | Local backend binding, port, and allowed browser origins. |

The sample environment files document the defaults. The backend is a development server intended for a trusted local network.

## Data and accessibility

Answers, local identity, generated NEXTs, completion history, written memories, and Time Capsules persist on the device or in that browser. Native photo attachments are copied into the app's local document storage; the browser can view its progress but cannot add photos. The Gemini request contains the five personalization answers. Completion notes, photos, capsules, and the demo password are not sent in that request. The identity screen is a **local demo flow**, not account authentication or cloud sync. Device reset, uninstall, or browser storage clearing can remove local data.

NEXT responds to the system's Reduce Motion and screen reader settings. Timed cinematic text offers manual advancement with a screen reader, and interactive destinations expose accessibility labels and actions.

## Project structure

```text
src/app/                 Expo Router screens
src/features/product/    NEXT flow, universe destinations, progress, persistence
src/features/experience/ Onboarding state and cinematic sequence
src/features/universe/   Three.js scene and camera controls
src/features/astronaut/  Astronaut loading and pose
server/                  Local generation API and Gemini request
assets/                  Bundled model and font assets
docs/                    Development notes and verification history
```

## Hackathon scope and next steps

This is the ShellHacks build of NEXT. The local identity flow and local persistence make the experience demonstrable without a production account service. Production authentication, secure hosted backend deployment, and cross-device sync are future work.

## Credits

The bundled astronaut model is **Astronaut by IvanPetrov**, licensed under **CC BY 4.0**. NEXT adjusts its pose and materials at runtime. See [model attribution](assets/astronaut/ATTRIBUTION.md) for the source, license, and modification details. Bundled font licenses are in [assets/dev/typography/licenses](assets/dev/typography/licenses).
