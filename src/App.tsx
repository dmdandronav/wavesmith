import { useEffect, useMemo, useRef, useState } from 'react';
import Matrix, { type Lane } from './components/Matrix';
import Transport from './components/Transport';
import WaveformStrip from './components/WaveformStrip';
import { SAMPLE_RATE, STEPS, defaultPattern, emptyPattern, type Pattern, type Waveform } from './core/pattern';
import { renderPattern, stepSamples } from './core/render';
import { encodeWav } from './core/wav';

export default function App() {
  const [pattern, setPattern] = useState<Pattern>(defaultPattern);
  const [playing, setPlaying] = useState(false);
  const [playheadStep, setPlayheadStep] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const samples = useMemo(() => renderPattern(pattern), [pattern]);
  const wavBytes = useMemo(() => encodeWav(samples, SAMPLE_RATE), [samples]);

  // The playing <audio> always holds the exact bytes the export button saves.
  useEffect(() => {
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    if (!playing) {
      audio.pause();
      return;
    }
    const previousUrl = urlRef.current;
    const resumeAt = audio.currentTime;
    const url = URL.createObjectURL(new Blob([wavBytes], { type: 'audio/wav' }));
    urlRef.current = url;
    audio.src = url;
    audio.loop = true;
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = resumeAt % audio.duration;
      }
    };
    audio.play().catch((error: DOMException) => {
      // reassigning src mid-play aborts the pending promise; that's not a failure
      if (error.name !== 'AbortError') setPlaying(false);
    });
    if (previousUrl) URL.revokeObjectURL(previousUrl);
  }, [playing, wavBytes]);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!playing) {
      setPlayheadStep(null);
      return;
    }
    const stepDurS = stepSamples(pattern.tempo) / SAMPLE_RATE;
    let raf = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        setPlayheadStep(Math.floor(audio.currentTime / stepDurS) % STEPS);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, pattern.tempo]);

  const toggle = (lane: Lane, row: number, step: number) => {
    setPattern((p) => {
      if (lane === 'lead') {
        return {
          ...p,
          lead: p.lead.map((r, i) => (i === row ? r.map((c, j) => (j === step ? !c : c)) : r)),
        };
      }
      return { ...p, [lane]: p[lane].map((c, j) => (j === step ? !c : c)) };
    });
  };

  const exportWav = () => {
    const url = URL.createObjectURL(new Blob([wavBytes], { type: 'audio/wav' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wavesmith-pattern.wav';
    anchor.click();
    // revoke async: Safari resolves the download's blob fetch after this task
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <main className="shell">
      <header className="masthead">
        <h1 className="wordmark">wavesmith</h1>
        <p className="tagline">WAV files forged from scratch — no audio-encoding library</p>
      </header>

      <Transport
        playing={playing}
        tempo={pattern.tempo}
        waveform={pattern.waveform}
        byteLength={wavBytes.byteLength}
        onPlayToggle={() => setPlaying((v) => !v)}
        onTempo={(tempo) => setPattern((p) => ({ ...p, tempo }))}
        onWaveform={(waveform: Waveform) => setPattern((p) => ({ ...p, waveform }))}
        onExport={exportWav}
        onClear={() => setPattern((p) => ({ ...emptyPattern(), tempo: p.tempo, waveform: p.waveform }))}
        onRiff={() => setPattern((p) => ({ ...defaultPattern(), tempo: p.tempo, waveform: p.waveform }))}
      />

      <Matrix pattern={pattern} playheadStep={playheadStep} onToggle={toggle} />
      <WaveformStrip samples={samples} playheadStep={playheadStep} />

      <footer className="colophon">
        <p>
          Every byte of the .wav — RIFF framing, <code>fmt&nbsp;</code> chunk, PCM16 data — is written by
          this app's own code, then verified in CI against a reference decoder. The preview above plays
          the identical buffer you download.
        </p>
      </footer>
    </main>
  );
}
