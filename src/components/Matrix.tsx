import { LEAD_LABELS, type Pattern } from '../core/pattern';

export type Lane = 'lead' | 'bass' | 'kick' | 'hat';

interface MatrixProps {
  pattern: Pattern;
  playheadStep: number | null;
  onToggle: (lane: Lane, row: number, step: number) => void;
}

const DRUM_LANES: Array<{ lane: Exclude<Lane, 'lead'>; label: string }> = [
  { lane: 'bass', label: 'bass' },
  { lane: 'kick', label: 'kick' },
  { lane: 'hat', label: 'hat' },
];

function cellClass(on: boolean, step: number, playheadStep: number | null, lane: Lane): string {
  const classes = ['cell', `cell-${lane}`];
  if (on) classes.push('on');
  if (step === playheadStep) classes.push('lit');
  if (step % 4 === 0) classes.push('bar');
  return classes.join(' ');
}

export default function Matrix({ pattern, playheadStep, onToggle }: MatrixProps) {
  return (
    <section className="matrix panel" aria-label="Pattern grid">
      {pattern.lead.map((row, r) => (
        <div className="lane" key={LEAD_LABELS[r]}>
          <span className="lane-label">{LEAD_LABELS[r]}</span>
          {row.map((on, s) => (
            <button
              key={s}
              type="button"
              className={cellClass(on, s, playheadStep, 'lead')}
              aria-pressed={on}
              aria-label={`${LEAD_LABELS[r]} step ${s + 1}`}
              onClick={() => onToggle('lead', r, s)}
            />
          ))}
        </div>
      ))}
      <div className="lane-divider" role="presentation" />
      {DRUM_LANES.map(({ lane, label }) => (
        <div className="lane" key={lane}>
          <span className="lane-label">{label}</span>
          {pattern[lane].map((on, s) => (
            <button
              key={s}
              type="button"
              className={cellClass(on, s, playheadStep, lane)}
              aria-pressed={on}
              aria-label={`${label} step ${s + 1}`}
              onClick={() => onToggle(lane, 0, s)}
            />
          ))}
        </div>
      ))}
    </section>
  );
}
