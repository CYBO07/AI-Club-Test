import React, { useState } from "react";
import { api, downloadBlob } from "../../api/client.js";
import { Icon } from "../../components/Icons.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function QuestionImport({ onDone }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function downloadTemplate() {
    const blob = await api.getBlob("/questions/import/template");
    downloadBlob(blob, "question_import_template.csv");
  }

  async function handleImport(e) {
    e.preventDefault();
    if (!file) return setError("Please choose a CSV or Excel file first.");
    setError(""); setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.postForm("/questions/import", formData);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-success-50 border border-success-500/20 p-4 text-sm text-success-700">
          <p className="font-bold">{result.createdCount} question(s) added successfully.</p>
          {result.failedCount > 0 && <p className="mt-1 text-warning-700">{result.failedCount} row(s) failed — see details below.</p>}
        </div>
        {result.failed.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-danger-500/20">
            <table className="w-full text-xs">
              <thead className="bg-danger-50 text-danger-700"><tr><th className="text-left p-2">Row</th><th className="text-left p-2">Error</th></tr></thead>
              <tbody>{result.failed.map((f, i) => <tr key={i} className="border-t border-danger-500/10"><td className="p-2">{f.row}</td><td className="p-2">{f.error}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <button onClick={() => { toast.success(`${result.createdCount} question(s) imported`); onDone(); }} className="btn-primary w-full">Done</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleImport} className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-line p-4 text-sm text-ink-600">
        Upload a CSV or Excel file with columns: Question, Option A–D, Correct Answer, Year, Category, Difficulty, Marks, Explanation.
        <button type="button" onClick={downloadTemplate} className="flex items-center gap-1.5 mt-2 text-cyan-600 font-semibold hover:underline"><Icon.download size={14} /> Download sample template</button>
      </div>
      <label className="block text-sm">
        <span className="label">File (.csv, .xlsx)</span>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files[0])} className="input" />
      </label>
      {error && <p className="text-sm text-danger-600 bg-danger-50 border border-danger-500/20 rounded-xl px-3.5 py-2.5">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Importing..." : "Import Questions"}</button>
    </form>
  );
}
