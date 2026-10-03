import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function Sparkline({ data, color = '#0d9488', height = 32, width = 100 }: SparklineProps) {
  const { path, areaPath } = useMemo(() => {
    if (data.length < 2) return { path: '', areaPath: '' };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const points = data.map((v, i) => ({
      x: i * stepX,
      y: height - ((v - min) / range) * (height - 4) - 2,
    }));
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;
    return { path, areaPath };
  }, [data, width, height]);

  if (!path) return null;

  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
}

export function BarChart({ data, height = 180, showValues = true }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((d, i) => {
        const barHeight = (d.value / max) * (height - 30);
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0">
            {showValues && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                {d.value.toLocaleString()}
              </span>
            )}
            <div
              className="w-full rounded-t-md transition-all duration-500 hover:opacity-80 relative group"
              style={{
                height: `${barHeight}px`,
                backgroundColor: d.color || '#0d9488',
                minHeight: '4px',
              }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-900 dark:bg-slate-700 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {d.label}: {d.value.toLocaleString()}
              </div>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface LineChartProps {
  data: { label: string; values: { name: string; color: string; points: number[] }[] };
  height?: number;
}

export function LineChart({ data, height = 200 }: LineChartProps) {
  const width = 400;
  const padding = { top: 10, right: 10, bottom: 24, left: 32 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allPoints = data.values.flatMap((v) => v.points);
  const min = Math.min(...allPoints);
  const max = Math.max(...allPoints);
  const range = max - min || 1;

  const labels = data.label ? data.label.split(',') : [];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padding.top + chartH * t;
        const val = max - range * t;
        return (
          <g key={t}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={padding.left - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-slate-400 text-[9px]"
            >
              {val.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Lines */}
      {data.values.map((series, si) => {
        const stepX = chartW / (series.points.length - 1);
        const points = series.points.map((v, i) => ({
          x: padding.left + i * stepX,
          y: padding.top + chartH - ((v - min) / range) * chartH,
        }));
        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

        return (
          <g key={si}>
            <path d={path} fill="none" stroke={series.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={series.color} strokeWidth="2" className="hover:r-4 transition-all" />
            ))}
          </g>
        );
      })}

      {/* X-axis labels */}
      {labels.map((label, i) => {
        const stepX = chartW / (labels.length - 1 || 1);
        return (
          <text
            key={i}
            x={padding.left + i * stepX}
            y={height - 6}
            textAnchor="middle"
            className="fill-slate-400 text-[9px]"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 160, thickness = 24, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const seg = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="transition-all duration-500 hover:opacity-80"
              />
            );
            offset += dash;
            return seg;
          })}
        </g>
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{centerValue}</span>}
          {centerLabel && <span className="text-xs text-slate-500 dark:text-slate-400">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

interface GaugeProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  color?: string;
}

export function Gauge({ value, max = 100, size = 140, label, color = '#0d9488' }: GaugeProps) {
  const pct = Math.min(value / max, 1);
  const radius = size / 2 - 12;
  const circumference = Math.PI * radius;
  const dash = pct * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size / 2 + 16 }}>
        <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
          <path
            d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
          <span className="text-xs text-slate-400">/ {max}</span>
        </div>
      </div>
      {label && <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, max, color = '#0d9488', height = 6 }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
