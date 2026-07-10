import { describe, expect, test } from 'vitest';
import { makeNoise, pulse25, saw, square, triangle, type Oscillator } from './osc';

/** Phase-accumulation helper mirroring how render.ts drives oscillators. */
function tone(osc: Oscillator, freq: number, nSamples: number, sampleRate: number): Float32Array {
  const out = new Float32Array(nSamples);
  let phase = 0;
  const step = freq / sampleRate;
  for (let i = 0; i < nSamples; i++) {
    out[i] = osc(phase);
    phase += step;
    if (phase >= 1) phase -= 1;
  }
  return out;
}

describe('oscillators', () => {
  test('square is +1 for first half period, -1 for second', () => {
    expect(square(0)).toBe(1);
    expect(square(0.49)).toBe(1);
    expect(square(0.5)).toBe(-1);
    expect(square(0.99)).toBe(-1);
  });

  test('pulse25 has 25% duty cycle', () => {
    expect(pulse25(0.1)).toBe(1);
    expect(pulse25(0.26)).toBe(-1);
  });

  test('triangle spans [-1, 1] and peaks mid-cycle', () => {
    expect(triangle(0)).toBeCloseTo(-1);
    expect(triangle(0.25)).toBeCloseTo(0);
    expect(triangle(0.5)).toBeCloseTo(1);
    expect(triangle(0.75)).toBeCloseTo(0);
  });

  test('saw ramps from -1 to 1', () => {
    expect(saw(0)).toBeCloseTo(-1);
    expect(saw(0.5)).toBeCloseTo(0);
    expect(saw(0.999)).toBeGreaterThan(0.99);
  });
});

describe('tone', () => {
  test('440 Hz square has ~440 rising edges per second', () => {
    const sr = 44100;
    const samples = tone(square, 440, sr, sr);
    let rising = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i - 1] < 0 && samples[i] > 0) rising++;
    }
    expect(rising).toBeGreaterThanOrEqual(439);
    expect(rising).toBeLessThanOrEqual(441);
  });
});

describe('makeNoise', () => {
  test('is deterministic for the same seed', () => {
    const a = makeNoise(42);
    const b = makeNoise(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  test('differs across seeds and stays in [-1, 1)', () => {
    const a = makeNoise(1);
    const b = makeNoise(2);
    const seqA = Array.from({ length: 50 }, a);
    const seqB = Array.from({ length: 50 }, b);
    expect(seqA).not.toEqual(seqB);
    for (const x of seqA) {
      expect(x).toBeGreaterThanOrEqual(-1);
      expect(x).toBeLessThan(1);
    }
  });

  test('zero seed does not produce a stuck generator', () => {
    const n = makeNoise(0);
    expect(n()).not.toBe(n());
  });
});
