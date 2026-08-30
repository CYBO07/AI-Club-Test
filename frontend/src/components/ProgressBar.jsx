import React from "react";

const tones = {
  cyan: "bg-cyan-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  navy: "bg-navy-900",
};

export default function ProgressBar({ value = 0, max = 100, tone = "cyan", label, showValue = true, size = "md" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5 text-sm">
          {label && <span className="text-ink-600 font-medium">{label}</span>}
          {showValue && <span className="text-ink-900 font-semibold font-mono text-xs">{pct}%</span>}
        </div>
      )}
      <div className={`w-full ${height} rounded-full bg-slate-100 overflow-hidden`}>
        <div className={`${height} rounded-full ${tones[tone]} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
