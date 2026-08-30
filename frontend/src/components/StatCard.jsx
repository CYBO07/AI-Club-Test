import React from "react";
import { Icon } from "./Icons.jsx";

const tones = {
  cyan: "bg-cyan-50 text-cyan-600",
  navy: "bg-navy-900/5 text-navy-900",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
};

export default function StatCard({ label, value, icon, tone = "cyan", trend }) {
  const IconCmp = icon;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</p>
        {IconCmp && (
          <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${tones[tone]}`}>
            <IconCmp size={17} />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-extrabold text-ink-900 tabular-nums">{value}</p>
      {trend && (
        <p className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${trend.direction === "down" ? "text-danger-600" : "text-success-600"}`}>
          <Icon.trend size={12} style={{ transform: trend.direction === "down" ? "scaleY(-1)" : "none" }} />
          {trend.label}
        </p>
      )}
    </div>
  );
}
