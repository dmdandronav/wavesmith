# wavesmith ●

**Chiptune patterns forged into real `.wav` files — no audio-encoding library.**

wavesmith is a browser step-sequencer whose export path is built entirely from
scratch: oscillators, envelopes, and mixing render your pattern to raw samples,
and a hand-written serializer packs them into a 16-bit PCM RIFF WAV — header
fields, chunk sizes, and little-endian PCM, byte by byte.

The trick that keeps it honest: **playback and export share one buffer.** The
`<audio>` loop plays a blob of the exact bytes the download button saves, so
what you hear is provably what you ship.

## 30-second demo

1. `npm install && npm run dev`
2. Hit **play** — a pre-seeded riff loops instantly
3. Click cells in the tone matrix (A-minor pentatonic — everything sounds good)
4. Switch the lead waveform: square → pulse → tri → saw
5. **⭳ export .wav**, then drop the file into QuickTime, a DAW, or an editor —
   it's a real PCM WAV that sounds identical to the preview

## What's forged from scratch

| Layer | Implementation |
|-------|----------------|
| Oscillators | square / 25% pulse / triangle / saw / sine via phase accumulation |
| Noise | xorshift32 seeded PRNG — renders are fully deterministic |
| Voices | lead matrix (16×8), triangle bass, sine pitch-drop kick, noise hat |
| Mix | additive with AD envelopes, `tanh` soft clip |
| **WAV encoder** | RIFF framing, `fmt ` chunk, PCM16 `data` chunk via `DataView` |

The only audio dependency is `wav-decoder` — a **dev-dependency** used in tests
to prove our bytes parse as valid WAV and round-trip within 16-bit
quantization error.

## Develop

```bash
npm install
npm run dev     # vite dev server
npm test        # 26 vitest specs, core at 100%
npm run lint    # eslint
npm run build   # tsc --noEmit && vite build
```

## Architecture

```
pattern (steps, tempo, waveform)
  → core/render.ts   oscillators + envelopes + mix  → Float32Array
  → core/wav.ts      RIFF/PCM16 serializer          → ArrayBuffer
  → one buffer       → <audio> preview AND .wav download
```

Core is pure TypeScript with zero browser APIs — it runs headless in CI. The
React shell (tone matrix, transport, waveform strip) is a thin layer over it.

MIT © dmdandronav
