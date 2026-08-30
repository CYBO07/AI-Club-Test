import React, { useEffect, useState, useCallback } from "react";
import { api, downloadBlob } from "../../api/client.js";
import Badge from "../../components/Badge.jsx";
import StatCard from "../../components/StatCard.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { SkeletonTableRows } from "../../components/Skeleton.jsx";
import { Icon } from "../../components/Icons.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function Results() {
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [testId, setTestId] = useState("");
  const [selectionStatus, setSelectionStatus] = useState("");
  const [minPercentage, setMinPercentage] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/tests").then(setTests); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ testId, selectionStatus, minPercentage });
    setResults(await api.get(`/results?${params.toString()}`));
    setLoading(false);
  }, [testId, selectionStatus, minPercentage]);

  useEffect(() => { load(); }, [load]);

  async function updateSelection(id, status) {
    await api.patch(`/results/${id}/selection`, { selectionStatus: status });
    toast.success(`Marked as ${status}`);
    load();
  }

  async function exportCsv() {
    const params = new URLSearchParams({ testId });
    const blob = await api.getBlob(`/results/export?${params.toString()}`);
    downloadBlob(blob, "results_export.csv");
  }

  const totalParticipants = results.length;
  const avgScore = totalParticipants ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / totalParticipants) : 0;
  const highestScore = totalParticipants ? Math.max(...results.map((r) => r.percentage)) : 0;
  const passRate = totalParticipants ? Math.round((results.filter((r) => r.percentage >= 40).length / totalParticipants) * 100) : 0;
  const completed = totalParticipants;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Results</h1>
          <p className="text-ink-400 mt-1 text-sm">Ranked, filterable, and ready to shortlist.</p>
        </div>
        <button onClick={exportCsv} className="btn-outline"><Icon.download size={16} /> Export CSV</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Participants" value={totalParticipants} icon={Icon.students} tone="cyan" />
        <StatCard label="Completed Tests" value={completed} icon={Icon.check} tone="success" />
        <StatCard label="Average Score" value={`${avgScore}%`} icon={Icon.analytics} tone="navy" />
        <StatCard label="Highest Score" value={`${highestScore}%`} icon={Icon.trophy} tone="warning" />
        <StatCard label="Pass Rate" value={`${passRate}%`} icon={Icon.results} tone="cyan" />
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={testId} onChange={(e) => setTestId(e.target.value)} className="input bg-white w-auto"><option value="">All Tests</option>{tests.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select>
        <select value={selectionStatus} onChange={(e) => setSelectionStatus(e.target.value)} className="input bg-white w-auto"><option value="">All Selection Status</option><option value="Pending">Pending</option><option value="Shortlisted">Shortlisted</option><option value="Selected">Selected</option><option value="Rejected">Rejected</option></select>
        <input value={minPercentage} onChange={(e) => setMinPercentage(e.target.value)} placeholder="Min %" type="number" className="input w-28" />
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-400 border-b border-line">
              <th className="p-3.5 font-semibold">Rank</th><th className="p-3.5 font-semibold">Student</th><th className="p-3.5 font-semibold">Roll No.</th><th className="p-3.5 font-semibold">Test</th>
              <th className="p-3.5 font-semibold">Correct</th><th className="p-3.5 font-semibold">Wrong</th><th className="p-3.5 font-semibold">Score</th>
              <th className="p-3.5 font-semibold">%</th><th className="p-3.5 font-semibold">Time</th><th className="p-3.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <SkeletonTableRows rows={6} cols={10} />}
            {!loading && results.length === 0 && <tr><td colSpan={10}><EmptyState icon={<Icon.results size={22} />} title="No results yet" description="Results will appear here once students complete a test." /></td></tr>}
            {results.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="p-3.5 font-mono text-xs text-ink-400">#{r.rank}</td>
                <td className="p-3.5 font-semibold text-ink-900">{r.student?.fullName}</td>
                <td className="p-3.5 font-mono text-xs text-ink-600">{r.student?.rollNumber}</td>
                <td className="p-3.5 text-ink-600">{r.test?.name}</td>
                <td className="p-3.5 text-success-600 font-semibold">{r.correct}</td>
                <td className="p-3.5 text-danger-600 font-semibold">{r.wrong}</td>
                <td className="p-3.5 font-mono">{r.score}/{r.totalMarks}</td>
                <td className="p-3.5 font-mono font-semibold">{r.percentage}%</td>
                <td className="p-3.5 text-ink-400 text-xs">{Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</td>
                <td className="p-3.5">
                  <select value={r.selectionStatus} onChange={(e) => updateSelection(r.id, e.target.value)} className="input py-1.5 px-2 text-xs w-auto bg-white">
                    <option value="Pending">Pending</option><option value="Shortlisted">Shortlisted</option><option value="Selected">Selected</option><option value="Rejected">Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
