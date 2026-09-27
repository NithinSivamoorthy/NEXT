/** Normal-motion arrival advances 1.5s; the approved discovery/hold stays intact. */
export const ARRIVAL_DELAY = -1.5;
export const HOLD_START = 19;
export const CONTROLS_AT = 21;
export const smooth = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const integral = (x: number) => x ** 6 - 3 * x ** 5 + 2.5 * x ** 4;
// Exact polynomial integral of smootherstep(x)^3. No frame-dependent integration.
const coefficients = [10, -15, 6];
const cube = Array<number>(16).fill(0);
for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) {
  cube[9 + a + b + c] += coefficients[a] * coefficients[b] * coefficients[c];
}
const pullIntegral = (x: number) => cube.reduce((sum, coefficient, power) => sum + coefficient * x ** (power + 1) / (power + 1), 0);
export const PEAK_VELOCITY = 432 / (5.5 * pullIntegral(1) + 0.5 + 5.3 / 2);
export function travel(t: number) {
  if (t < 3.2) return { distance: 0, velocity: 0 };
  if (t < 8.7) {
    const x = (t - 3.2) / 5.5;
    return { distance: PEAK_VELOCITY * 5.5 * pullIntegral(x), velocity: PEAK_VELOCITY * smooth(0, 1, x) ** 3 };
  }
  const approachDistance = PEAK_VELOCITY * 5.5 * pullIntegral(1);
  if (t < 9.2) return { distance: approachDistance + PEAK_VELOCITY * (t - 8.7), velocity: PEAK_VELOCITY };
  if (t < 14.5) {
    const x = (t - 9.2) / 5.3;
    return { distance: approachDistance + PEAK_VELOCITY * (0.5 + 5.3 * (x - integral(x))), velocity: PEAK_VELOCITY * (1 - smooth(9.2, 14.5, t)) };
  }
  return { distance: 432 + 4 * smooth(17, 29, t - ARRIVAL_DELAY), velocity: 0 };
}
// Reduce Motion keeps this original typography clock; normal motion samples it 1.6x faster.
export const lettersOpacity = (t: number) => smooth(0.8, 2, t) * (1 - smooth(3.7, 5.3, t));
