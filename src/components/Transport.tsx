import type { Waveform } from '../core/pattern';

interface TransportProps {
  playing: boolean;
  tempo: number;
  waveform: Waveform;
  byteLength: number;
  onPlayToggle: () => void;
  onTempo: (tempo: number) => void;
  onWaveform: (waveform: Waveform) => void;
  onExport: () => void;
  onClear: () => void;
  onRiff: () => void;
}

const WAVEFORMS: Array<{ id: Waveform; label: string }> = [
  { id: 'square', label: '⊓ square' },
  { id: 'pulse25', label: '⨅ pulse' },
  { id: 'triangle', label: '△ tri' },
  { id: 'saw', label: '◿ saw' },
];

export default function Transport(props: TransportProps) {
  const { playing, tempo, waveform, byteLength } = props;
  return (
    <section className="transport panel" aria-label="Transport">
      <button
        type="button"
        className={`play ${playing ? 'stop' : ''}`}
        onClick={props.onPlayToggle}
        aria-pressed={playing}
      >
        {playing ? '■ stop' : '▶ play'}
      </button>

      <label className="tempo">
        <span className="control-label">tempo</span>
        <input
          type="range"
          min={60}
          max={200}
          value={tempo}
          onChange={(e) => props.onTempo(Number(e.target.value))}
        />
        <span className="readout">{tempo} bpm</span>
      </label>

      <div className="waveforms" role="group" aria-label="Lead waveform">
        {WAVEFORMS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`wave ${waveform === id ? 'selected' : ''}`}
            aria-pressed={waveform === id}
            onClick={() => props.onWaveform(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="transport-actions">
        <button type="button" className="ghost" onClick={props.onClear}>
          clear
        </button>
        <button type="button" className="ghost" onClick={props.onRiff}>
          riff
        </button>
        <button type="button" className="export" onClick={props.onExport}>
          ⭳ export .wav
        </button>
      </div>

      <p className="byte-readout">
        44-byte RIFF header + {(byteLength - 44).toLocaleString()} bytes PCM — written by hand
      </p>
    </section>
  );
}
