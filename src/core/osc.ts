import type { Waveform } from './pattern';

/** All oscillators take a phase in [0, 1) and return a sample in [-1, 1]. */
export type Oscillator = (phase: number) => number;

export const square: Oscillator = (p) => (p < 0.5 ? 1 : -1);

export const pulse25: Oscillator = (p) => (p < 0.25 ? 1 : -1);

export const triangle: Oscillator = (p) => (p < 0.5 ? 4 * p - 1 : 3 - 4 * p);

export const saw: Oscillator = (p) => 2 * p - 1;

export const sine: Oscillator = (p) => Math.sin(2 * Math.PI * p);

export const OSCILLATORS: Record<Waveform, Oscillator> = {
  square,
  pulse25,
  triangle,
  saw,
};

/** xorshift32 PRNG → deterministic noise in [-1, 1). Seed must be non-zero. */
export function makeNoise(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return (s / 0x80000000) - 1;
  };
}
