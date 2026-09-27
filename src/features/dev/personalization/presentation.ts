import { smooth } from '../cinematic/timeline';

/** Raw foreground seconds: NEXT establishes first; no dependency on the paused journey clock. */
export const sloganOpacity = (t: number) => smooth(1.65, 2.15, t) * (1 - smooth(3.75, 4.15, t));
export function reflectionLayout(height: number, safeTop: number, starY: number, keyboardTop: number | null, typing: boolean) {
  const top = safeTop + (typing ? 8 : Math.max(24, height * 0.075 - safeTop));
  const bottom = Math.min(starY - 62, (keyboardTop ?? height) - 16);
  return { top, height: Math.max(60, bottom - top), fontSize: typing ? 19 : 26, lineHeight: typing ? 23 : 32 };
}
