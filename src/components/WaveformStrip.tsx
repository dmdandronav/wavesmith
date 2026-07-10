import { useEffect, useRef, useState } from 'react';
import { STEPS } from '../core/pattern';

interface WaveformStripProps {
  samples: Float32Array;
  playheadStep: number | null;
}

export default function WaveformStrip({ samples, playheadStep }: WaveformStripProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [redraw, setRedraw] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setRedraw((n) => n + 1));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const styles = getComputedStyle(canvas);
    ctx.clearRect(0, 0, width, height);

    // bar gridlines
    ctx.strokeStyle = styles.getPropertyValue('--color-line');
    ctx.lineWidth = 1;
    for (let s = 0; s <= STEPS; s += 4) {
      const x = (s / STEPS) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // min/max envelope
    ctx.fillStyle = styles.getPropertyValue('--color-accent');
    const mid = height / 2;
    for (let x = 0; x < width; x++) {
      const from = Math.floor((x / width) * samples.length);
      const to = Math.floor(((x + 1) / width) * samples.length);
      let min = 0;
      let max = 0;
      for (let i = from; i < to; i++) {
        if (samples[i] < min) min = samples[i];
        if (samples[i] > max) max = samples[i];
      }
      ctx.fillRect(x, mid - max * mid * 0.92, 1, Math.max(1, (max - min) * mid * 0.92));
    }

    if (playheadStep !== null) {
      ctx.fillStyle = styles.getPropertyValue('--color-ink');
      ctx.globalAlpha = 0.7;
      ctx.fillRect(((playheadStep + 0.5) / STEPS) * width - 1, 0, 2, height);
      ctx.globalAlpha = 1;
    }
  }, [samples, playheadStep, redraw]);

  return (
    <section className="strip panel" aria-label="Rendered waveform">
      <canvas ref={canvasRef} className="strip-canvas" />
    </section>
  );
}
