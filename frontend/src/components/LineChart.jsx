import { money, shortDate } from '../utils/format.js';

// Plain SVG line chart: one series, three y gridlines, first/middle/last x labels.
export default function LineChart({ data, xKey, yKey }) {
  const W = 640, H = 210, L = 52, R = 12, T = 12, B = 26;
  const max = Math.max(1, ...data.map((d) => d[yKey]));
  const step = 10 ** Math.floor(Math.log10(max));
  const top = Math.ceil(max / step) * step;
  const x = (i) => L + (i * (W - L - R)) / Math.max(1, data.length - 1);
  const y = (v) => T + (1 - v / top) * (H - T - B);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[yKey]).toFixed(1)}`).join(' ');
  const labels = [0, Math.floor((data.length - 1) / 2), data.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Daily sales revenue">
      {[0, top / 2, top].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="grid" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" className="axis">{money(t)}</text>
        </g>
      ))}
      <path d={path} className="line" />
      {data.map((d, i) => (
        <circle key={d[xKey]} cx={x(i)} cy={y(d[yKey])} r="2.5" className="dot">
          <title>{`${shortDate(d[xKey])}: ${money(d[yKey])}`}</title>
        </circle>
      ))}
      {labels.map((i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="axis">{shortDate(data[i][xKey])}</text>
      ))}
    </svg>
  );
}
