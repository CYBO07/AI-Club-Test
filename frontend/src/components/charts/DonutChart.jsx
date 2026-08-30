import React from "react";

// segments: [{ label, value, color }]
export default function DonutChart({ segments, size = 160, thickness = 20, centerLabel, centerValue }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness} />
        {segments.map((seg) => {
          const frac = seg.value / total;
          const dash = frac * circumference;
          const el = (
            <circle
              key={seg.label}
              cx={c} cy={c} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${c} ${c})`}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-ink-900">{centerValue}</span>
          <span className="text-[11px] text-ink-400 font-medium">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}
