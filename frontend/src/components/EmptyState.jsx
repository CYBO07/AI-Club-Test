import React from "react";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="h-14 w-14 rounded-2xl bg-slate-100 text-ink-400 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <p className="font-semibold text-ink-900">{title}</p>
      {description && <p className="text-sm text-ink-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
