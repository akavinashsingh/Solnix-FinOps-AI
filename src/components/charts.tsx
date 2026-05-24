import React from 'react';

/* ============================================================
 *  Lightweight, dependency-free SVG charts.
 *  All sized to fit a parent container's width.
 * ============================================================ */

export interface BarDatum { label: string; value: number; tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral'; }

const TONE: Record<NonNullable<BarDatum['tone']>, string> = {
  accent:  'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger:  'var(--color-danger)',
  neutral: 'var(--color-ink-3)',
};

const fmt = (n: number) => n.toLocaleString('en-IN');

/* -----------------------------------------------------------
 *  Bar chart (vertical)
 * ----------------------------------------------------------- */
export const BarChart: React.FC<{
  data: BarDatum[];
  height?: number;
  showValues?: boolean;
  valueFormatter?: (v: number) => string;
}> = ({ data, height = 180, showValues = true, valueFormatter = fmt }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  const W = 100;
  const padTop = 16;
  const padBottom = 28;
  const innerH = height - padTop - padBottom;
  const barWidth = (W / data.length) * 0.65;
  const gap = (W / data.length) * 0.35;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" width="100%" height={height}>
      {/* Y-axis grid */}
      {[0.25, 0.5, 0.75, 1].map((g, i) => (
        <line
          key={i}
          x1="0" x2={W}
          y1={padTop + innerH * (1 - g)} y2={padTop + innerH * (1 - g)}
          stroke="var(--color-border)" strokeWidth="0.2" strokeDasharray={i === 3 ? "0" : "0.5 0.5"}
        />
      ))}

      {data.map((d, i) => {
        const x = i * (barWidth + gap) + gap / 2;
        const h = (d.value / max) * innerH;
        const y = padTop + innerH - h;
        const color = TONE[d.tone ?? 'accent'];
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barWidth} height={h} rx={0.5} fill={color} />
            {showValues && (
              <text
                x={x + barWidth / 2}
                y={y - 2}
                fontSize="3"
                textAnchor="middle"
                fill="var(--color-ink-2)"
                fontFamily="DM Mono, monospace"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {valueFormatter(d.value)}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={height - 16}
              fontSize="3"
              textAnchor="middle"
              fill="var(--color-ink-3)"
              fontFamily="DM Sans, sans-serif"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* -----------------------------------------------------------
 *  Stacked horizontal bar (status / category breakdown)
 * ----------------------------------------------------------- */
export const StackedBar: React.FC<{
  segments: Array<{ label: string; value: number; tone: NonNullable<BarDatum['tone']> }>;
  height?: number;
}> = ({ segments, height = 14 }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let cursor = 0;
  return (
    <div className="w-full" style={{ height }}>
      <div className="w-full h-full rounded-sm overflow-hidden flex bg-surface-2 border border-border">
        {segments.map((s) => {
          const pct = (s.value / total) * 100;
          cursor += pct;
          return (
            <div
              key={s.label}
              title={`${s.label}: ${s.value}`}
              style={{ width: `${pct}%`, background: TONE[s.tone] }}
              className="h-full"
            />
          );
        })}
      </div>
    </div>
  );
};

/* -----------------------------------------------------------
 *  Sparkline / line
 * ----------------------------------------------------------- */
export const Sparkline: React.FC<{ points: number[]; tone?: BarDatum['tone']; height?: number; showFill?: boolean }> = ({
  points, tone = 'accent', height = 40, showFill = true,
}) => {
  if (points.length === 0) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const W = 100;
  const H = height;
  const pad = 2;
  const innerH = H - pad * 2;
  const innerW = W - pad * 2;
  const scaleX = (i: number) => pad + (i / (points.length - 1 || 1)) * innerW;
  const scaleY = (v: number) => pad + innerH - ((v - min) / Math.max(max - min, 1)) * innerH;

  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ');
  const fillPath = `${path} L ${scaleX(points.length - 1)} ${H - pad} L ${scaleX(0)} ${H - pad} Z`;
  const color = TONE[tone];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H}>
      {showFill && (
        <path d={fillPath} fill={color} opacity="0.12" />
      )}
      <path d={path} stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* -----------------------------------------------------------
 *  Donut chart with center label
 * ----------------------------------------------------------- */
export const Donut: React.FC<{
  segments: Array<{ label: string; value: number; tone: NonNullable<BarDatum['tone']> }>;
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}> = ({ segments, size = 120, centerLabel, centerValue }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const innerR = r - 12;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
        {segments.map((s) => {
          const length = (s.value / total) * circumference;
          const segment = (
            <circle
              key={s.label}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={TONE[s.tone]}
              strokeWidth="12"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += length;
          return segment;
        })}
        <circle cx={cx} cy={cy} r={innerR - 2} fill="var(--color-surface)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
        {centerValue && <div className="font-display text-[22px] leading-none text-ink-1 tabular tracking-tight-data">{centerValue}</div>}
        {centerLabel && <div className="text-[10px] font-data uppercase tracking-label text-ink-3 mt-1">{centerLabel}</div>}
      </div>
    </div>
  );
};

/* -----------------------------------------------------------
 *  Legend bullet list
 * ----------------------------------------------------------- */
export const LegendList: React.FC<{
  items: Array<{ label: string; value: number; tone: NonNullable<BarDatum['tone']>; sub?: string }>;
  total?: number;
}> = ({ items, total }) => {
  const sum = (total ?? items.reduce((s, x) => s + x.value, 0)) || 1;
  return (
    <ul className="flex flex-col gap-1.5 m-0 p-0 list-none">
      {items.map(it => (
        <li key={it.label} className="flex items-center gap-2 text-[12px]">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: TONE[it.tone] }} />
          <span className="flex-1 text-ink-2">{it.label}</span>
          <span className="font-data tabular text-ink-1">{fmt(it.value)}</span>
          <span className="text-[10px] font-data text-ink-3 tabular w-9 text-right">{Math.round((it.value / sum) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
};

/* -----------------------------------------------------------
 *  Histogram for distributions (CIBIL / DTI etc.)
 * ----------------------------------------------------------- */
export const Histogram: React.FC<{
  bins: Array<{ label: string; count: number }>;
  tone?: BarDatum['tone'];
  height?: number;
}> = ({ bins, tone = 'accent', height = 100 }) => {
  const max = Math.max(1, ...bins.map(b => b.count));
  const W = 100;
  const padBottom = 14;
  const innerH = height - padBottom - 4;
  const barWidth = (W / bins.length) * 0.9;
  const gap = (W / bins.length) * 0.1;
  const color = TONE[(tone ?? 'accent') as NonNullable<BarDatum['tone']>];

  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" width="100%" height={height}>
      {bins.map((b, i) => {
        const x = i * (barWidth + gap) + gap / 2;
        const h = (b.count / max) * innerH;
        const y = 4 + innerH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={h} fill={color} rx="0.4" />
            <text x={x + barWidth / 2} y={height - 4} fontSize="3" textAnchor="middle" fill="var(--color-ink-3)" fontFamily="DM Mono, monospace">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
};
