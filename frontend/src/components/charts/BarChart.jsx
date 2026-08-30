import React from "react";

// Lightweight, dependency-free grouped bar chart rendered as inline SVG.
// series: [{ name, color, values: number[] }], labels: string[]
export default function BarChart({ labels, series, height = 220 }) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const width = 640;
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const groupW = chartW / labels.length;
  const barW = Math.min(22, (groupW - 12) / series.length);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={padding.left} x2={width - padding.right} y1={padding.top + chartH * (1 - t)} y2={padding.top + chartH * (1 - t)} stroke="#E2E8F0" strokeWidth="1" />
      ))}
      {labels.map((label, i) => {
        const groupX = padding.left + i * groupW;
        return (
          <g key={label}>
            {series.map((s, si) => {
              const v = s.values[i] || 0;
              const h = (v / max) * chartH;
              const x = groupX + (groupW - series.length * barW) / 2 + si * barW;
              const y = padding.top + chartH - h;
              return <rect key={s.name} x={x} y={y} width={barW - 4} height={Math.max(h, 1)} rx="4" fill={s.color} />;
            })}
            <text x={groupX + groupW / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748B" fontFamily="Inter, sans-serif">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}
