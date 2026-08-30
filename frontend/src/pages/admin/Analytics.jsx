import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Icon } from "../../components/Icons.jsx";
import StatCard from "../../components/StatCard.jsx";
import BarChart from "../../components/charts/BarChart.jsx";
import DonutChart from "../../components/charts/DonutChart.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { SkeletonCard } from "../../components/Skeleton.jsx";

const BUCKETS = ["0-20", "21-40", "41-60", "61-80", "81-100"];
function bucketOf(pct) {
  if (pct <= 20) return 0; if (pct <= 40) return 1; if (pct <= 60) return 2; if (pct <= 80) return 3; return 4;
}

export default function Analytics() {
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [qStats, setQStats] = useState(null);
  const [studentTotals, setStudentTotals] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/results"), api.get("/tests"), api.get("/questions/stats")]).then(async ([r, t, qs]) => {
      setResults(r); setTests(t); setQStats(qs);
      const years = [...new Set(t.map((x) => x.year))];
      const totals = {};
      await Promise.all(years.map(async (y) => { const d = await api.get(`/students?year=${encodeURIComponent(y)}&limit=1`); totals[y] = d.total; }));
      setStudentTotals(totals);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !qStats) return <div className="space-y-6"><SkeletonCard /><SkeletonCard /></div>;

  const totalParticipants = results.length;
  const avgScore = totalParticipants ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / totalParticipants) : 0;
  const passRate = totalParticipants ? Math.round((results.filter((r) => r.percentage >= 40).length / totalParticipants) * 100) : 0;

  const distribution = BUCKETS.map((_, i) => results.filter((r) => bucketOf(r.percentage) === i).length);

  const participationLabels = tests.map((t) => t.name.length > 14 ? t.name.slice(0, 14) + "…" : t.name);
  const registeredSeries = tests.map((t) => studentTotals[t.year] || 0);
  const completedSeries = tests.map((t) => results.filter((r) => String(r.test?._id || r.test) === String(t._id)).length);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Analytics</h1>
        <p className="text-ink-400 mt-1 text-sm">Recruitment activity and performance at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Participants" value={totalParticipants} icon={Icon.students} tone="cyan" />
        <StatCard label="Average Score" value={`${avgScore}%`} icon={Icon.analytics} tone="navy" />
        <StatCard label="Pass Rate" value={`${passRate}%`} icon={Icon.trophy} tone="success" />
        <StatCard label="Tests Configured" value={tests.length} icon={Icon.tests} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-bold text-ink-900 mb-1">Score distribution</h2>
          <p className="text-xs text-ink-400 mb-4">Number of results in each score bracket, across all tests.</p>
          {totalParticipants === 0 ? <EmptyState icon={<Icon.analytics size={20} />} title="No results yet" /> : (
            <BarChart labels={BUCKETS} series={[{ name: "Results", color: "#06B6D4", values: distribution }]} />
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-ink-900 mb-1">Participation</h2>
          <p className="text-xs text-ink-400 mb-4">Registered students vs. completed attempts, per test.</p>
          {tests.length === 0 ? <EmptyState icon={<Icon.tests size={20} />} title="No tests yet" /> : (
            <BarChart
              labels={participationLabels}
              series={[
                { name: "Registered", color: "#CBD5E1", values: registeredSeries },
                { name: "Completed", color: "#06B6D4", values: completedSeries },
              ]}
            />
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-ink-400">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-slate-300" /> Registered</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-cyan-500" /> Completed</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-bold text-ink-900 mb-4">Question bank composition</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {Object.entries(qStats).map(([year, s]) => (
            <div key={year} className="card p-5 flex items-center gap-4">
              <DonutChart
                size={100} thickness={14}
                centerValue={s.Total}
                centerLabel="questions"
                segments={[
                  { label: "Easy", value: s.Easy, color: "#10B981" },
                  { label: "Medium", value: s.Medium, color: "#F59E0B" },
                  { label: "Hard", value: s.Hard, color: "#EF4444" },
                ]}
              />
              <div>
                <p className="font-bold text-ink-900 text-sm">{year}</p>
                <div className="mt-2 space-y-1 text-xs text-ink-600">
                  <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-500" /> Easy: {s.Easy}</p>
                  <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning-500" /> Medium: {s.Medium}</p>
                  <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger-500" /> Hard: {s.Hard}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
