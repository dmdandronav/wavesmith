import { BASS_FREQ, LEAD_FREQS, SAMPLE_RATE, STEPS, type Pattern } from './pattern';
import { OSCILLATORS, makeNoise, sine, triangle, type Oscillator } from './osc';

const LEAD_GAIN = 0.26;
const BASS_GAIN = 0.3;
const KICK_GAIN = 0.55;
const HAT_GAIN = 0.14;
const ATTACK_S = 0.003;

export function stepSamples(tempo: number): number {
  return Math.round((SAMPLE_RATE * 60) / tempo / 4); // 16th notes
}

/** Additively render one enveloped tone into `out` starting at `start`. */
function addNote(
  out: Float32Array,
  start: number,
  osc: Oscillator,
  freq: number,
  gain: number,
  lengthSamples: number,
  decayTauS: number,
): void {
  const attackSamples = Math.max(1, Math.round(ATTACK_S * SAMPLE_RATE));
  const decayK = Math.exp(-1 / (decayTauS * SAMPLE_RATE));
  let phase = 0;
  const phaseStep = freq / SAMPLE_RATE;
  let env = 1;
  // tails wrap around the buffer end: the pattern loops, so the seam stays click-free
  for (let t = 0; t < Math.min(lengthSamples, out.length); t++) {
    const attack = t < attackSamples ? t / attackSamples : 1;
    out[(start + t) % out.length] += osc(phase) * gain * attack * env;
    if (t >= attackSamples) env *= decayK;
    phase += phaseStep;
    if (phase >= 1) phase -= 1;
  }
}

function addKick(out: Float32Array, start: number): void {
  const length = Math.min(Math.round(0.16 * SAMPLE_RATE), out.length);
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 150 * Math.exp(-t / 0.05) + 45;
    const env = Math.exp(-t / 0.06);
    out[(start + i) % out.length] += sine(phase) * KICK_GAIN * env;
    phase += freq / SAMPLE_RATE;
    if (phase >= 1) phase -= 1;
  }
}

function addHat(out: Float32Array, start: number, step: number): void {
  const noise = makeNoise(0xc0ffee ^ step); // per-step seed keeps renders deterministic
  const length = Math.min(Math.round(0.05 * SAMPLE_RATE), out.length);
  for (let i = 0; i < length; i++) {
    const env = Math.exp(-(i / SAMPLE_RATE) / 0.012);
    out[(start + i) % out.length] += noise() * HAT_GAIN * env;
  }
}

/** Pattern → mono Float32Array at 44.1 kHz. Pure and deterministic. */
export function renderPattern(pattern: Pattern): Float32Array {
  const perStep = stepSamples(pattern.tempo);
  const out = new Float32Array(perStep * STEPS);
  const stepDurS = perStep / SAMPLE_RATE;
  const leadOsc = OSCILLATORS[pattern.waveform];

  for (let s = 0; s < STEPS; s++) {
    const start = s * perStep;
    for (let row = 0; row < LEAD_FREQS.length; row++) {
      if (pattern.lead[row][s]) {
        addNote(out, start, leadOsc, LEAD_FREQS[row], LEAD_GAIN, Math.round(perStep * 1.6), stepDurS * 0.55);
      }
    }
    if (pattern.bass[s]) {
      addNote(out, start, triangle, BASS_FREQ, BASS_GAIN, Math.round(perStep * 1.9), stepDurS * 0.8);
    }
    if (pattern.kick[s]) addKick(out, start);
    if (pattern.hat[s]) addHat(out, start, s);
  }

  for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i]); // soft clip
  return out;
}
