import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import StatCard from "../../components/StatCard.jsx";
import Badge from "../../components/Badge.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { Icon } from "../../components/Icons.jsx";
import { SkeletonCard } from "../../components/Skeleton.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const DIFF_COLOR = { Easy: "#10B981", Medium: "#F59E0B", Hard: "#EF4444" };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState({ total: 0 });
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/questions/stats"),
      api.get("/students?limit=1"),
      api.get("/tests"),
      api.get("/results"),
    ]).then(([qStats, studentList, testList, resultList]) => {
      setStats(qStats); setStudents(studentList); setTests(testList); setResults(resultList);
    }).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  const grandTotal = Object.values(stats).reduce((sum, y) => sum + y.Total, 0);
  const activeTests = tests.filter((t) => t.status === "Active").length;
  const closedTests = tests.filter((t) => t.status === "Closed").length;
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">{greeting}, {user?.fullName?.split(" ")[0] || "Admin"}</h1>
        <p className="text-ink-400 mt-1">Manage recruitment tests, questions, students and results.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Registered Students" value={students.total ?? 0} icon={Icon.students} tone="cyan" />
        <StatCard label="Total Questions" value={grandTotal} icon={Icon.bank} tone="navy" />
        <StatCard label="Active Tests" value={activeTests} icon={Icon.tests} tone="success" trend={activeTests ? { label: `${tests.length} total configured`, direction: "up" } : undefined} />
        <StatCard label="Completed Tests" value={closedTests} icon={Icon.check} tone="warning" />
        <StatCard label="Average Score" value={avgScore !== null ? `${avgScore}%` : "—"} icon={Icon.analytics} tone="cyan" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink-900">Question bank overview</h2>
          <Link to="/admin/questions" className="text-sm font-semibold text-cyan-600 hover:underline">Manage questions →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(stats).map(([year, s]) => (
            <Link to="/admin/questions" key={year} className="card p-5 hover:border-cyan-500/40 hover:shadow-pop transition group">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-ink-900">{year}</h4>
                <span className="font-mono text-xs text-ink-400 group-hover:text-cyan-600 transition">{s.Total} total</span>
              </div>
              <div className="mt-4 space-y-3">
                {["Easy", "Medium", "Hard"].map((d) => (
                  <ProgressBar key={d} label={d} value={s[d]} max={Math.max(s.Total, 1)} tone={d === "Easy" ? "success" : d === "Medium" ? "warning" : "danger"} size="sm" showValue={false} />
                ))}
              </div>
              {s.Total === 0 && <p className="mt-3 text-xs text-ink-400">No questions added yet for this year.</p>}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink-900">Tests</h2>
          <Link to="/admin/tests" className="text-sm font-semibold text-cyan-600 hover:underline">Manage tests →</Link>
        </div>
        <div className="card divide-y divide-line overflow-hidden">
          {tests.length === 0 && <EmptyState icon={<Icon.tests size={20} />} title="No tests created yet" description="Create your first test to get started." />}
          {tests.slice(0, 5).map((t) => (
            <div key={t._id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink-900 text-sm truncate">{t.name}</p>
                <p className="text-xs text-ink-400">{t.year} · {t.numberOfQuestions} questions · {t.duration} min</p>
              </div>
              <Badge>{t.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
