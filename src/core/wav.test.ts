import { describe, expect, test } from 'vitest';
import { decode } from 'wav-decoder';
import { defaultPattern, SAMPLE_RATE } from './pattern';
import { renderPattern } from './render';
import { encodeWav, floatTo16 } from './wav';

const ascii = (view: DataView, offset: number, length: number) =>
  Array.from({ length }, (_, i) => String.fromCharCode(view.getUint8(offset + i))).join('');

describe('floatTo16', () => {
  test('maps full-scale values to int16 extremes', () => {
    expect(floatTo16(1)).toBe(0x7fff);
    expect(floatTo16(-1)).toBe(-0x8000);
    expect(floatTo16(0)).toBe(0);
  });

  test('clamps out-of-range input', () => {
    expect(floatTo16(2.5)).toBe(0x7fff);
    expect(floatTo16(-2.5)).toBe(-0x8000);
  });
});

describe('encodeWav header', () => {
  const samples = new Float32Array([0, 0.5, -0.5, 1]);
  const view = new DataView(encodeWav(samples, SAMPLE_RATE));

  test('RIFF/WAVE framing with correct sizes', () => {
    expect(ascii(view, 0, 4)).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(36 + samples.length * 2);
    expect(ascii(view, 8, 4)).toBe('WAVE');
  });

  test('fmt chunk describes mono PCM16 at the given rate', () => {
    expect(ascii(view, 12, 4)).toBe('fmt ');
    expect(view.getUint32(16, true)).toBe(16);
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(SAMPLE_RATE);
    expect(view.getUint32(28, true)).toBe(SAMPLE_RATE * 2);
    expect(view.getUint16(32, true)).toBe(2);
    expect(view.getUint16(34, true)).toBe(16);
  });

  test('data chunk holds little-endian PCM16 samples', () => {
    expect(ascii(view, 36, 4)).toBe('data');
    expect(view.getUint32(40, true)).toBe(samples.length * 2);
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(floatTo16(0.5));
    expect(view.getInt16(50, true)).toBe(0x7fff);
  });
});

describe('keystone: reference decoder round-trip', () => {
  test('a rendered pattern decodes back to the same audio', async () => {
    const samples = renderPattern(defaultPattern());
    const decoded = await decode(encodeWav(samples, SAMPLE_RATE));

    expect(decoded.sampleRate).toBe(SAMPLE_RATE);
    expect(decoded.channelData).toHaveLength(1);
    const roundTripped = decoded.channelData[0];
    expect(roundTripped).toHaveLength(samples.length);

    const quantum = 1 / 0x8000;
    for (let i = 0; i < samples.length; i += 997) {
      expect(Math.abs(roundTripped[i] - samples[i])).toBeLessThanOrEqual(quantum * 1.01);
    }
  });
});
