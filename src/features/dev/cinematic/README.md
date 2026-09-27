# Checkpoint 4B.2 — continuous pull through the point

Development route: `/dev/cinematic`. Release builds redirect to `/`.
No external astronaut, textures, model loaders, post-processing, audio or haptics.
The existing local Clash Display Bold font is reused without changing the audition.

## Rendering

One deterministic 700-star volume with two draws: soft points and short world-space
line segments. Both use the same positions and travel velocity. No screen-space
warp overlay. Camera distance is the integral of a smooth velocity curve; the
period is a real scene object aligned with the independently fading RN letters.
No camera cuts or replacement star field at arrival.

4B.2 retains the ray/sphere boundary but concentrates its near-camera density:
2.2-radius support instead of 5, steeper Gaussian falloff, much weaker halo and
near-neutral white. No timed full-screen flash or exposure plateau. Camera speed
makes the near-boundary event extremely short; it may span only a frame on device.

All 700 stars now use the same broad seeded volume. The previous 72-star narrow
cone caused the central cloud and is removed, including its special recycling.
Points and world-space trails share the projected aperture, depth fading and
continuous camera velocity. The aperture opens with approach distance so deeper
space and trails are already apparent before crossing. No post-crossing trail gate.
Live material uniform updates are retained.

The untextured low-detail astronaut is an EXPLICITLY TEMPORARY blocking mannequin.
It must not become the production astronaut. Its asymmetrical pose is fixed;
only very slow bounded group drift and rotation occur in the normal hold.
Key light comes from upper left/front; a cooler edge light comes from right/rear.
No shadows, environment map, transmission, bloom or other post-processing.

## Foreground timeline (seconds)

Normal-motion timing:

- 0–0.5: black.
- 0.5–1.25: NEXT and independent period appear.
- 2.3125–3.3125: letters disappear.
- 3.2–8.7: one continuous acceleration, using smootherstep cubed for velocity.
- Approximately 6.49084: point crossing at 27.09 world units/second, still accelerating.
- 8.7–9.2: peak 86.28 world units/second.
- 9.2–14.5: controlled deceleration.
- 14.5–18.5: original four-second astronaut discovery.
- 15.5–27.5: original final four world units of camera settling.
- 19.5 onward: controls and indefinite hold.

Previously: setup through 5.3; approach 5–8; crossing 8–9.8; suspension 9.8–10.4;
acceleration 10.4–14.4; peak 14.4–15.4; deceleration 15.4–20.4; discovery 20.4–24.4;
controls 25.4; final settling through 33.4.

Astronaut geometry, position, scale, pose, drift/rotation, lights and arrival camera
endpoint remain unchanged. Its full discovery/hold clock simply starts 5.9 seconds
earlier than 4B.1. Acceleration is integrated analytically; joins match velocity
and acceleration. No separate crossing/suspension motion segment remains.

At arrival the figure is about 10% of portrait height, approaching roughly 12%
after the camera settles. These are composition targets, not measured device results.

Reduce Motion retains the wordmark and point, dissolves the point at 6–9 seconds,
reveals a stationary star field at 7–12, and lights the still proxy at 16–20.
Controls still appear at 21 seconds in Reduce Motion. No camera travel, FOV change, trails, drift or rotation. Changing the preference
restarts the presentation. Accessibility settings resolve before rendering starts.
App background, route blur and browser document hiding stop the frame loop.
Timeline uses bounded rendered deltas so returning does not jump past the sequence.

## Device acceptance (still required)

Open the route in Expo Go using `exp://HOST:8081/--/dev/cinematic` with HOST from
the running Expo server. Current LAN address during implementation: 10.10.9.161.
If restarting Metro: `npx expo start --lan --clear` (stop the old process first).

- Watch in portrait at normal screen brightness, with Reduce Motion off and on.
- Assess whether there is any identifiable handoff between point and travel; check luminous crossing, uninterrupted acceleration and absence of a central cloud or held luminous disk. Confirm the approved astronaut framing and hold are preserved.
- Check sustained smoothness, heat and stability through a several-minute hold.
- Background during travel, return, replay twice, and exit to normal NEXT.
- Reopen `/dev/typography` and the existing universe for physical-device regression checks.

This prototype answers: initial/final screen size, placement, negative space,
approach distance, drift/rotation speed, light direction, discovery timing and
how much silhouette/surface detail the eventual astronaut needs. It cannot
validate a future model's textures, rig, visor shading, licensing or memory cost.
