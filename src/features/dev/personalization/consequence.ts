import { smooth } from '../cinematic/timeline';

export const CONSEQUENCE_SETTLE = 3.5;
export const REDUCED_SETTLE = 1.4;
export const FRAGMENT_COUNT = 14;
export const TRACE_SEGMENTS = 5;

/** Foreground-time envelope: no interpretation of answer content. */
export function consequenceAt(age: number, reduced: boolean) {
  if (reduced) return { contraction: 0, pulse: 0, formation: 1, opacity: smooth(0.6, REDUCED_SETTLE, age), settled: smooth(0.6, REDUCED_SETTLE, age) };
  return {
    contraction: smooth(0.35, 0.7, age) * (1 - smooth(0.8, 1.1, age)),
    pulse: smooth(0.7, 0.9, age) * (1 - smooth(0.9, 1.3, age)),
    formation: smooth(1.15, 2.7, age),
    opacity: smooth(0.9, 1.4, age),
    settled: smooth(2.5, CONSEQUENCE_SETTLE, age),
  };
}

export type Fragment = { radius: number; phase: number; inclination: number; yaw: number; speed: number; weight: number; size: number; eccentricity: number };
export const fragments: readonly Fragment[] = Array.from({ length: FRAGMENT_COUNT }, (_, i) => ({
  radius: 0.65 + ((i * 7) % 13) / 13 * 0.75,
  phase: i * 2.39996323,
  inclination: -0.65 + ((i * 5) % 11) / 11 * 1.15,
  yaw: -0.45 + ((i * 3) % 7) / 7 * 0.9,
  speed: 0.015 + (i % 5) * 0.006,
  weight: 0.5 + ((i * 3) % 8) / 8 * 0.4,
  size: 2.4 + (i % 4) * 0.5,
  eccentricity: 0.55 + (i % 3) * 0.12,
}));

/** World-space local coordinates. Outlying matter gathers, then enters distinct tilted paths. */
export function fragmentPosition(f: Fragment, age: number, reduced: boolean, tail = 0, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
  const formation = reduced ? 1 : smooth(1.15, 2.7, age);
  const gather = reduced ? 1 : smooth(0.9, 1.55, age);
  const initialRadius = f.radius * 1.9;
  const radius = (initialRadius * (1 - gather) + f.radius * 0.4 * gather) * (1 - formation) + f.radius * formation;
  const angle = f.phase + (reduced ? 0.65 : 0.65 * formation + Math.max(0, age - CONSEQUENCE_SETTLE) * f.speed) - tail;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * f.eccentricity;
  const z = Math.sin(angle) * radius * Math.sin(f.inclination);
  out[0] = x * Math.cos(f.yaw) + z * Math.sin(f.yaw);
  out[1] = y * Math.cos(f.inclination);
  out[2] = -x * Math.sin(f.yaw) + z * Math.cos(f.yaw);
  return out;
}
