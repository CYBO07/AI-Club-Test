import React from "react";
import { Icon } from "./Icons.jsx";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-[2px] p-4">
      <div className="animate-fade-in bg-white rounded-2xl shadow-pop w-full max-w-sm p-6">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${danger ? "bg-danger-50 text-danger-600" : "bg-cyan-50 text-cyan-600"}`}>
          <Icon.alert size={20} />
        </div>
        <h3 className="font-bold text-lg text-ink-900">{title}</h3>
        <p className="mt-2 text-sm text-ink-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-ghost">Cancel</button>
          <button onClick={onConfirm} className={danger ? "btn-danger" : "btn-accent"}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
