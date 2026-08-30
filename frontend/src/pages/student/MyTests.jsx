import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { Icon } from "../../components/Icons.jsx";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { SkeletonLine } from "../../components/Skeleton.jsx";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function MyTests() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/attempts/history").then(setHistory).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">My Tests</h1>
        <p className="text-ink-400 mt-1">Every test you've started or completed.</p>
      </div>

      {loading && (
        <div className="card divide-y divide-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4"><SkeletonLine className="w-1/3 mb-2" /><SkeletonLine className="w-1/4" /></div>
          ))}
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="card">
          <EmptyState icon={<Icon.bank size={22} />} title="No tests yet" description="Once you start a test, it will appear here." />
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="card divide-y divide-line overflow-hidden">
          {history.map((h) => {
            const pct = h.test.totalMarks > 0 ? Math.round((h.score / h.test.totalMarks) * 100) : null;
            return (
              <div key={h.attemptId} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-ink-900">{h.test.name}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{h.test.year} · Started {fmtDate(h.startedAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  {h.status !== "InProgress" && pct !== null && (
                    <span className="text-sm font-mono font-bold text-ink-900">{h.score}/{h.test.totalMarks} <span className="text-ink-400 font-normal">({pct}%)</span></span>
                  )}
                  <Badge>{h.status === "InProgress" ? "In Progress" : "Completed"}</Badge>
                  {h.status === "InProgress" ? (
                    <button onClick={() => navigate("/test")} className="btn-accent px-3.5 py-2 text-xs">Resume</button>
                  ) : (
                    <button onClick={() => navigate("/my-results")} className="btn-outline px-3.5 py-2 text-xs">View Result</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
