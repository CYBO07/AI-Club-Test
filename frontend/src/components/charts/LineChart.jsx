import React from "react";

// A single-series line chart (polyline) as inline SVG.
export default function LineChart({ labels, values, color = "#06B6D4", height = 180 }) {
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const width = 640;
  const padding = { top: 16, right: 12, bottom: 24, left: 12 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const stepX = labels.length > 1 ? chartW / (labels.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - ((v - min) / (max - min || 1)) * chartH;
    return [x, y];
  });

  const pathD = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaD = `${pathD} L${points[points.length - 1][0]},${padding.top + chartH} L${points[0][0]},${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={padding.left} x2={width - padding.right} y1={padding.top + chartH * (1 - t)} y2={padding.top + chartH * (1 - t)} stroke="#E2E8F0" strokeWidth="1" />
      ))}
      <path d={areaD} fill="url(#lineFill)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={color} />)}
      {labels.map((label, i) => (
        <text key={label} x={padding.left + i * stepX} y={height - 6} textAnchor="middle" fontSize="11" fill="#64748B" fontFamily="Inter, sans-serif">{label}</text>
      ))}
    </svg>
  );
}
