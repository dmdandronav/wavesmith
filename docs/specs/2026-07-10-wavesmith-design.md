# wavesmith — design spec

Chiptune patterns forged into real `.wav` files. No audio-encoding library.

## Core trick

A pure synthesis pipeline renders a 16-step pattern to samples and serializes
them into a 16-bit PCM RIFF WAV file **byte by byte** — RIFF header, `fmt `
chunk, `data` chunk, little-endian PCM. The exact same `ArrayBuffer` powers
in-app playback (blob URL → `<audio loop>`) and the download, so what you hear
is provably what you export. Web Audio never synthesizes anything; it only
plays our bytes.

## Scope (v1)

- **Tone matrix**: 16 steps × 8 notes (A-minor pentatonic across two octaves),
  lead voice with selectable waveform (square / 25% pulse / triangle / saw)
- **Bass lane**: 16 root-note toggles, triangle voice one octave down
- **Drum lanes**: kick (sine pitch-drop) and hat (seeded-noise burst)
- **Transport**: play/stop loop, tempo 60–200 BPM
- **Waveform strip**: canvas min/max envelope of the rendered samples
- **Export**: download the rendered buffer as `pattern.wav`

Cut from v1: stereo, swing, per-step velocity, pattern save/share.

## Architecture

```
pattern (steps, tempo, waveform)
  → render.ts   oscillators + AD envelopes + mix + soft clip → Float32Array
  → wav.ts      Float32Array → PCM16 RIFF ArrayBuffer
  → one buffer  → <audio> playback AND .wav download
```

- `src/core/pattern.ts` — types, pentatonic scale table, default pattern
- `src/core/osc.ts` — square/pulse/triangle/saw/sine oscillators, xorshift32
  seeded noise (deterministic renders)
- `src/core/render.ts` — pattern → mono Float32Array at 44.1 kHz
- `src/core/wav.ts` — RIFF/PCM16 serializer (the from-scratch encoder)
- `src/components/` — Matrix, Transport, WaveformStrip
- Core is pure and browser-free; UI is a thin shell.

## Testing

- vitest, node environment; core at ~100% coverage
- Oscillator frequency accuracy via zero-crossing counts; seeded noise
  reproducibility; envelope silence outside active steps
- WAV header fields asserted byte-by-byte (chunk ids, sizes, block align)
- **Keystone**: rendered file round-trips through `wav-decoder` (reference
  parser, dev-dependency only) — sample rate, length, and sample values match
  within 16-bit quantization error

## Visual direction

Four-track tape studio: warm charcoal surface, cream ink, VU-amber accent,
cassette-label typography (Archivo + Space Mono), oklch tokens throughout.

## 30-second demo

Click a few cells → hit play (loops instantly) → drag tempo → switch waveform
→ Export WAV → drop the file in any editor/DAW — it's a real PCM WAV, and it
sounds identical to the preview because it *is* the preview.
