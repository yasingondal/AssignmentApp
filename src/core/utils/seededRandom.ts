/** Deterministic PRNG (Mulberry32) for stable mock data generation. */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  const index = Math.floor(rng() * items.length);
  return items[index]!;
}

export function pickN<T>(rng: () => number, items: readonly T[], count: number): T[] {
  const copy = [...items];
  const result: T[] = [];
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy.splice(idx, 1)[0]!);
  }
  return result;
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randomFloat(rng: () => number, min: number, max: number, decimals = 2): number {
  const value = rng() * (max - min) + min;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
