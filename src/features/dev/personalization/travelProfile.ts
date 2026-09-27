/** Leave point entry untouched through 6.5s; compress subsequent travel by 3.5s.
 * Smooth clock derivative is 1 at both joins: no velocity discontinuity.
 * The original discovery/hold spacing and final camera position are preserved.
 */
export function contactTravelClock(seconds: number) {
  if (seconds <= 6.5) return { time: seconds, rate: 1 };
  if (seconds >= 11) return { time: seconds + 3.5, rate: 1 };
  const x = (seconds - 6.5) / 4.5;
  const ease = x * x * x * (10 - 15 * x + 6 * x * x);
  return { time: seconds + 3.5 * ease, rate: 1 + (30 * 3.5 / 4.5) * x * x * (1 - x) ** 2 };
}
