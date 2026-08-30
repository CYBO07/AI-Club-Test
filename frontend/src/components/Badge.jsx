import React from "react";

const styles = {
  Active: "bg-success-50 text-success-600",
  Disabled: "bg-danger-50 text-danger-600",
  Inactive: "bg-slate-100 text-ink-400",
  Draft: "bg-slate-100 text-ink-600",
  Paused: "bg-warning-50 text-warning-600",
  Closed: "bg-danger-50 text-danger-600",
  "Not Attempted": "bg-slate-100 text-ink-400",
  "In Progress": "bg-warning-50 text-warning-600",
  Completed: "bg-success-50 text-success-600",
  Available: "bg-cyan-50 text-cyan-600",
  Pending: "bg-slate-100 text-ink-600",
  Shortlisted: "bg-cyan-50 text-cyan-600",
  Selected: "bg-success-50 text-success-600",
  Rejected: "bg-danger-50 text-danger-600",
  Qualified: "bg-success-50 text-success-600",
  "Not Qualified": "bg-danger-50 text-danger-600",
  Easy: "bg-success-50 text-success-600",
  Medium: "bg-warning-50 text-warning-600",
  Hard: "bg-danger-50 text-danger-600",
};

export default function Badge({ children, dot = false }) {
  const cls = styles[children] || "bg-slate-100 text-ink-600";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
