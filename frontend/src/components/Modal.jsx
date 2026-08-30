import React, { useEffect } from "react";
import { Icon } from "./Icons.jsx";

export default function Modal({ open, title, subtitle, onClose, children, wide = false, xwide = false }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const maxW = xwide ? "max-w-4xl" : wide ? "max-w-2xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/50 backdrop-blur-[2px] p-4 py-8 sm:py-12">
      <div className={`animate-fade-in bg-white rounded-2xl shadow-pop w-full ${maxW} p-6 sm:p-7`}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg text-ink-900">{title}</h3>
            {subtitle && <p className="text-sm text-ink-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="focus-ring text-ink-400 hover:text-ink-900 hover:bg-slate-100 rounded-lg p-1.5 transition">
            <Icon.x size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
