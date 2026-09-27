/** Match the Canvas 48° vertical FOV; keep near bodies inside portrait side margins.
 * A width-dependent camera only backs away when the actual composition needs it.
 */
import { WORLDS } from './worlds';
export const WORLD_EXTENTS = { today: .62, history: .95, memory: .87, profile: .60, star: .85 } as const;
export function restingDistance(width: number, height: number): number {
  const tangent = Math.tan(24 * Math.PI / 180);
  const aspect = Math.max(.1, width / Math.max(1, height));
  const usableX = Math.max(.35, 1 - 32 / Math.max(1, width));
  return Math.max(12.2, ...WORLDS.map(world => world.at[2] +
    (Math.abs(world.at[0]) + WORLD_EXTENTS[world.id]) / (tangent * aspect * usableX)));
}
