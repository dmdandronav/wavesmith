import { describe, expect, test } from 'vitest';
import { emptyPattern, STEPS } from './pattern';
import { renderPattern, stepSamples } from './render';

function rms(samples: Float32Array, from: number, to: number): number {
  let sum = 0;
  for (let i = from; i < to; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / (to - from));
}

describe('renderPattern', () => {
  test('output length is exactly steps × samples-per-step', () => {
    const p = emptyPattern();
    expect(renderPattern(p).length).toBe(stepSamples(p.tempo) * STEPS);
  });

  test('empty pattern renders silence', () => {
    const out = renderPattern(emptyPattern());
    expect(out.every((x) => x === 0)).toBe(true);
  });

  test('a lead note produces energy in its step and none far away', () => {
    const p = emptyPattern();
    p.lead[3][0] = true;
    const out = renderPattern(p);
    const per = stepSamples(p.tempo);
    expect(rms(out, 0, per)).toBeGreaterThan(0.02);
    expect(rms(out, per * 8, per * 9)).toBe(0);
  });

  test('bass, kick and hat lanes each produce energy', () => {
    for (const lane of ['bass', 'kick', 'hat'] as const) {
      const p = emptyPattern();
      p[lane][4] = true;
      const out = renderPattern(p);
      const per = stepSamples(p.tempo);
      expect(rms(out, per * 4, per * 5)).toBeGreaterThan(0.005);
    }
  });

  test('renders are deterministic', () => {
    const p = emptyPattern();
    p.lead[0][0] = true;
    p.hat[3] = true;
    expect(renderPattern(p)).toEqual(renderPattern(p));
  });

  test('all samples stay within [-1, 1] even with every cell active', () => {
    const p = emptyPattern();
    p.lead = p.lead.map((row) => row.map(() => true));
    p.bass = p.bass.map(() => true);
    p.kick = p.kick.map(() => true);
    p.hat = p.hat.map(() => true);
    const out = renderPattern(p);
    for (const x of out) {
      expect(Math.abs(x)).toBeLessThanOrEqual(1);
    }
  });

  test('tempo changes step length', () => {
    expect(stepSamples(70)).toBe(2 * stepSamples(140));
  });
});
