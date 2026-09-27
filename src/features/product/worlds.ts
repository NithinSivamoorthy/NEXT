export type WorldId = 'today' | 'history' | 'profile' | 'memory' | 'star';

/**
 * The one ordered list of navigable bodies in the universe.
 *
 * The scene projects these positions to screen space and the overlay keeps one Animated value,
 * one cached position and one hit target per entry, both indexed by this array's order. Adding
 * a body here adds it to every one of those at once, so the scene and the overlay cannot
 * disagree about how many targets exist — which is what broke when Memory and the hero star
 * were added to the scene while the overlay still sized its bookkeeping by hand.
 *
 * `at` is the world position, `anchor` the fraction of the viewport used to place the overlay
 * label before the first projection arrives, and `rotates` marks the bodies that accept direct
 * rotation. No three.js dependency here: the overlay must not pull in the renderer.
 */
export const WORLDS = [
  { id: 'today', at: [-.6, -2.0, .7], anchor: [.38, .70], rotates: true, labelOffset: 10 },
  { id: 'history', at: [1.4, .35, -1.6], anchor: [.70, .40], rotates: true, labelOffset: 0 },
  { id: 'profile', at: [1.35, -2.8, .8], anchor: [.75, .77], rotates: false, labelOffset: 0 },
  { id: 'memory', at: [-1.35, .05, .1], anchor: [.22, .50], rotates: true, labelOffset: 0 },
  { id: 'star', at: [-.45, 2.85, -.3], anchor: [.41, .24], rotates: false, labelOffset: 12 },
] as const satisfies readonly { id: WorldId; at: readonly [number, number, number]; anchor: readonly [number, number]; rotates: boolean; labelOffset: number }[];

/** Rotatable bodies in scene order. The overlay creates exactly this many controllers. */
export const ROTATABLE: readonly WorldId[] = WORLDS.filter(world => world.rotates).map(world => world.id);
export const worldIndex = (id: WorldId) => WORLDS.findIndex(world => world.id === id);
