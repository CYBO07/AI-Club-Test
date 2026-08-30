import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Icon } from "../../components/Icons.jsx";
import Badge from "../../components/Badge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { SkeletonCard } from "../../components/Skeleton.jsx";

export default function MyResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/my-results").then(setResults).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Results</h1>
        <p className="text-ink-400 mt-1">Your performance on every completed test.</p>
      </div>

      {results.length === 0 && (
        <div className="card"><EmptyState icon={<Icon.results size={22} />} title="No results yet" description="Complete a test to see your results here." /></div>
      )}

      <div className="space-y-5">
        {results.map((r) => (
          <div key={r.id} className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg text-ink-900">{r.test.name}</h3>
                <p className="text-xs text-ink-400">{r.test.year}</p>
              </div>
              {r.selectionStatus && r.selectionStatus !== "Pending" && <Badge>{r.selectionStatus}</Badge>}
            </div>

            <div className="mt-5 grid sm:grid-cols-[auto_1fr] gap-6 items-center">
              <div className="text-center sm:text-left">
                <p className="text-4xl font-extrabold text-ink-900">{r.score}<span className="text-lg text-ink-400 font-semibold">/{r.totalMarks}</span></p>
                <p className="text-cyan-600 font-bold font-mono text-sm mt-0.5">{r.percentage}%</p>
                {r.rank && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-warning-600 bg-warning-50 rounded-full px-2.5 py-1">
                    <Icon.trophy size={13} /> Rank #{r.rank} of {r.outOf}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 w-full">
                <Metric label="Correct" value={r.correct} tone="text-success-600" />
                <Metric label="Incorrect" value={r.wrong} tone="text-danger-600" />
                <Metric label="Unanswered" value={r.unanswered} tone="text-ink-400" />
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-line flex flex-wrap items-center justify-between gap-3 text-sm text-ink-400">
              <span className="flex items-center gap-1.5"><Icon.clock size={14} /> Time taken: {Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</span>
              <ProgressBar value={r.percentage} max={100} tone={r.percentage >= 70 ? "success" : r.percentage >= 40 ? "warning" : "danger"} showValue={false} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="text-center bg-slate-50 rounded-xl py-3">
      <p className={`text-xl font-extrabold ${tone}`}>{value}</p>
      <p className="text-[11px] text-ink-400 font-medium mt-0.5">{label}</p>
    </div>
  );
}
