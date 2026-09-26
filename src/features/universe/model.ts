/** Stable scene data: a future progress model can supply IDs/seeds without touching rendering. */
export const HERO_STAR = { id: 'hero', radius: 1, seed: 7021 } as const;

export function createStarField(seed: number, count = 3200) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    // A faint tilted band among a diffuse spherical distribution, with three depth layers.
    const band = random() < 0.4;
    const y = band ? (random() + random() + random() - 1.5) * 0.3 : random() * 2 - 1;
    const ring = Math.sqrt(1 - y * y);
    const depth = i % 3;
    const radius = [18, 40, 80][depth] + random() * [22, 40, 60][depth];
    const x = Math.cos(angle) * ring;
    const z = Math.sin(angle) * ring;
    positions.set([x * radius, (y * 0.91 + x * 0.41) * radius, (z + y * 0.12) * radius], i * 3);
    const bright = Math.pow(random(), 2);
    const power = 0.22 + bright * 0.7;
    const warmth = random();
    const color = warmth < 0.16 ? [1, 0.76, 0.52] : warmth > 0.82 ? [0.66, 0.79, 1] : [0.86, 0.9, 1];
    colors.set(color.map((channel) => channel * power), i * 3);
    sizes[i] = (0.8 + bright * 2.4) * (radius / 30) ** 0.55;
    phases[i] = random() * Math.PI * 2;
  }
  return { positions, colors, sizes, phases };
}
