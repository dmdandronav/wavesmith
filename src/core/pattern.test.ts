import { describe, expect, test } from 'vitest';
import { BASS_FREQ, LEAD_FREQS, NOTE_ROWS, STEPS, defaultPattern, emptyPattern } from './pattern';

describe('scale table', () => {
  test('has one frequency per row, descending', () => {
    expect(LEAD_FREQS).toHaveLength(NOTE_ROWS);
    for (let i = 1; i < LEAD_FREQS.length; i++) {
      expect(LEAD_FREQS[i]).toBeLessThan(LEAD_FREQS[i - 1]);
    }
  });

  test('anchors: row 5 is A4, top row is A5, bass is A2', () => {
    expect(LEAD_FREQS[5]).toBeCloseTo(440);
    expect(LEAD_FREQS[0]).toBeCloseTo(880);
    expect(BASS_FREQ).toBeCloseTo(110);
  });
});

describe('patterns', () => {
  test('emptyPattern has correct shape and no active cells', () => {
    const p = emptyPattern();
    expect(p.lead).toHaveLength(NOTE_ROWS);
    for (const row of p.lead) {
      expect(row).toHaveLength(STEPS);
      expect(row.every((c) => !c)).toBe(true);
    }
    expect(p.bass).toHaveLength(STEPS);
    expect(p.kick).toHaveLength(STEPS);
    expect(p.hat).toHaveLength(STEPS);
  });

  test('defaultPattern has active cells in every lane', () => {
    const p = defaultPattern();
    expect(p.lead.some((row) => row.some(Boolean))).toBe(true);
    expect(p.bass.some(Boolean)).toBe(true);
    expect(p.kick.some(Boolean)).toBe(true);
    expect(p.hat.some(Boolean)).toBe(true);
  });

  test('defaultPattern does not share row arrays with a fresh empty pattern', () => {
    const p = defaultPattern();
    const q = emptyPattern();
    p.lead[0][0] = true;
    expect(q.lead[0][0]).toBe(false);
  });
});
