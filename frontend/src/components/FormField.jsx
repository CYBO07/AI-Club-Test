import React from "react";

export function TextInput({ label, required, hint, ...props }) {
  return (
    <label className="block text-sm">
      <span className="label">{label} {required && <span className="text-danger-500">*</span>}</span>
      <input {...props} className="input" />
      {hint && <span className="block mt-1 text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

export function SelectInput({ label, required, options, hint, ...props }) {
  return (
    <label className="block text-sm">
      <span className="label">{label} {required && <span className="text-danger-500">*</span>}</span>
      <select {...props} className="input bg-white">
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {hint && <span className="block mt-1 text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, required, hint, ...props }) {
  return (
    <label className="block text-sm">
      <span className="label">{label} {required && <span className="text-danger-500">*</span>}</span>
      <textarea {...props} className="input" />
      {hint && <span className="block mt-1 text-xs text-ink-400">{hint}</span>}
    </label>
  );
}
