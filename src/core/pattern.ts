export const STEPS = 16;
export const NOTE_ROWS = 8;
export const SAMPLE_RATE = 44100;

export type Waveform = 'square' | 'pulse25' | 'triangle' | 'saw';

export interface Pattern {
  tempo: number;
  waveform: Waveform;
  /** [NOTE_ROWS][STEPS], row 0 is the highest note */
  lead: boolean[][];
  bass: boolean[];
  kick: boolean[];
  hat: boolean[];
}

const A4 = 440;
const semitone = (n: number) => A4 * 2 ** (n / 12);

/** A-minor pentatonic, two octaves, high to low: A5 G5 E5 D5 C5 A4 G4 E4 */
export const LEAD_FREQS: readonly number[] = [12, 10, 7, 5, 3, 0, -2, -5].map(semitone);

export const LEAD_LABELS: readonly string[] = ['A5', 'G5', 'E5', 'D5', 'C5', 'A4', 'G4', 'E4'];

export const BASS_FREQ = semitone(-24); // A2

export function emptyPattern(): Pattern {
  return {
    tempo: 112,
    waveform: 'square',
    lead: Array.from({ length: NOTE_ROWS }, () => Array<boolean>(STEPS).fill(false)),
    bass: Array<boolean>(STEPS).fill(false),
    kick: Array<boolean>(STEPS).fill(false),
    hat: Array<boolean>(STEPS).fill(false),
  };
}

/** Pre-seeded riff so the app makes music before a single click. */
export function defaultPattern(): Pattern {
  const p = emptyPattern();
  const riff: Array<[row: number, step: number]> = [
    [5, 0], [3, 2], [2, 3], [5, 4], [1, 6], [2, 7],
    [0, 8], [2, 10], [3, 11], [5, 12], [4, 14], [5, 15],
  ];
  const lead = p.lead.map((row) => [...row]);
  for (const [row, step] of riff) lead[row][step] = true;
  return {
    ...p,
    lead,
    bass: p.bass.map((_, i) => i % 4 === 0),
    kick: p.kick.map((_, i) => i % 4 === 0),
    hat: p.hat.map((_, i) => i % 2 === 1),
  };
}
