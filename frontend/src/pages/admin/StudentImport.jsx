import React, { useState } from "react";
import { api, downloadBlob } from "../../api/client.js";
import { Icon } from "../../components/Icons.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function StudentImport({ onDone }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [passwordMode, setPasswordMode] = useState("generate");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function downloadTemplate() {
    const blob = await api.getBlob("/students/import/template");
    downloadBlob(blob, "student_import_template.csv");
  }

  async function handleImport(e) {
    e.preventDefault();
    if (!file) return setError("Please choose a CSV or Excel file first.");
    setError("");
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("passwordMode", passwordMode);
      if (passwordMode === "manual") formData.append("password", password);
      const res = await api.postForm("/students/import", formData);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function downloadCredentials() {
    const rows = result.created.filter((c) => c.temporaryPassword).map((c) => `${c.fullName},${c.rollNumber},${c.username},${c.email},${c.year},${c.temporaryPassword}`).join("\n");
    const header = "Full Name,Roll Number,Username,Email,Year,Temporary Password\n";
    const blob = new Blob([header + rows], { type: "text/csv" });
    downloadBlob(blob, "imported_student_credentials.csv");
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-success-50 border border-success-500/20 p-4 text-sm text-success-700">
          <p className="font-bold">{result.createdCount} student(s) created successfully.</p>
          {result.failedCount > 0 && <p className="mt-1 text-warning-700">{result.failedCount} row(s) failed — see details below.</p>}
        </div>
        {passwordMode === "generate" && result.createdCount > 0 && (
          <button onClick={downloadCredentials} className="btn-accent w-full">
            <Icon.download size={16} /> Download Temporary Passwords (shown once)
          </button>
        )}
        {result.failed.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-danger-500/20">
            <table className="w-full text-xs">
              <thead className="bg-danger-50 text-danger-700"><tr><th className="text-left p-2">Row</th><th className="text-left p-2">Name</th><th className="text-left p-2">Error</th></tr></thead>
              <tbody>{result.failed.map((f, i) => <tr key={i} className="border-t border-danger-500/10"><td className="p-2">{f.row}</td><td className="p-2">{f.fullName || "-"}</td><td className="p-2">{f.error}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <button onClick={() => { toast.success(`${result.createdCount} student(s) imported`); onDone(); }} className="btn-primary w-full">Done</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleImport} className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-line p-4 text-sm text-ink-600">
        Upload a CSV or Excel file with columns: <span className="font-mono text-xs">Full Name, Roll Number, Email, Username, Year</span>.
        <button type="button" onClick={downloadTemplate} className="flex items-center gap-1.5 mt-2 text-cyan-600 font-semibold hover:underline">
          <Icon.download size={14} /> Download sample template
        </button>
      </div>

      <label className="block text-sm">
        <span className="label">File (.csv, .xlsx)</span>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} className="input" />
      </label>

      <div className="space-y-2">
        <p className="label mb-1">Password assignment</p>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="radio" checked={passwordMode === "generate"} onChange={() => setPasswordMode("generate")} />
          Auto-generate a temporary password for each student
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="radio" checked={passwordMode === "manual"} onChange={() => setPasswordMode("manual")} />
          Use one password for all imported students
        </label>
        {passwordMode === "manual" && (
          <input type="text" placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        )}
      </div>

      {error && <p className="text-sm text-danger-600 bg-danger-50 border border-danger-500/20 rounded-xl px-3.5 py-2.5">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Importing..." : "Import Students"}</button>
    </form>
  );
}
