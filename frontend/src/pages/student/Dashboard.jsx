import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { Icon } from "../../components/Icons.jsx";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { SkeletonCard } from "../../components/Skeleton.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [available, setAvailable] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/attempts/available"), api.get("/attempts/history")])
      .then(([a, h]) => { setAvailable(a); setHistory(h); })
      .finally(() => setLoading(false));
  }, []);

  async function handleStart() {
    setStarting(true);
    try {
      await api.post("/attempts/start", { testId: available.test.id });
      navigate("/test");
    } catch (err) {
      toast.error(err.message);
      setStarting(false);
    }
  }

  const completed = history.filter((h) => h.status !== "InProgress");
  const scores = completed.map((h) => (h.test.totalMarks > 0 ? (h.score / h.test.totalMarks) * 100 : 0));
  const bestScore = scores.length ? Math.round(Math.max(...scores)) : null;
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Welcome back, {user?.fullName?.split(" ")[0]}</h1>
        <p className="text-ink-400 mt-1">Ready to test your skills and become part of the AI Club?</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Tests Available" value={available?.test ? 1 : 0} icon={Icon.tests} tone="cyan" />
        <Stat label="Tests Completed" value={completed.length} icon={Icon.check} tone="success" />
        <Stat label="Best Score" value={bestScore !== null ? `${bestScore}%` : "—"} icon={Icon.trophy} tone="warning" />
        <Stat label="Average Score" value={avgScore !== null ? `${avgScore}%` : "—"} icon={Icon.analytics} tone="navy" />
      </div>

      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-3">Your test</h2>
        {!available?.test ? (
          <div className="card">
            <EmptyState
              icon={<Icon.tests size={22} />}
              title="No test available yet"
              description={available?.message || "No questions have been added for this test yet. Please contact the administrator."}
            />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-navy-950 text-white p-6 sm:p-8">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#06B6D4 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Badge>{available.attemptStatus === "InProgress" ? "In Progress" : available.attemptStatus ? "Completed" : "Available"}</Badge>
                <span className="text-xs text-slate-400">{available.test.year}</span>
              </div>
              <h3 className="text-2xl font-extrabold">{available.test.name}</h3>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                <Detail icon={Icon.bank} label={`${available.test.numberOfQuestions} Questions`} />
                <Detail icon={Icon.clock} label={`${available.test.duration} Minutes`} />
                <Detail icon={Icon.trophy} label={`${available.test.totalMarks} Marks`} />
              </div>
              <div className="mt-7">
                {available.attemptStatus === "InProgress" ? (
                  <button onClick={handleStart} disabled={starting} className="btn-accent px-6 py-3">
                    Resume Test <Icon.chevronRight size={16} />
                  </button>
                ) : available.attemptStatus ? (
                  <p className="text-sm font-medium text-success-500">You've already completed this test. Check My Results for details.</p>
                ) : (
                  <button onClick={handleStart} disabled={starting} className="btn-accent px-6 py-3">
                    {starting ? "Starting..." : "Start Test"} <Icon.chevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-ink-900">Recent activity</h2>
            <Link to="/my-tests" className="text-sm font-semibold text-cyan-600 hover:underline">View all →</Link>
          </div>
          <div className="card divide-y divide-line overflow-hidden">
            {history.slice(0, 4).map((h) => (
              <div key={h.attemptId} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900 text-sm truncate">{h.test.name}</p>
                  <p className="text-xs text-ink-400">{h.test.year}</p>
                </div>
                <Badge>{h.status === "InProgress" ? "In Progress" : "Completed"}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: IconCmp, tone }) {
  const tones = { cyan: "bg-cyan-50 text-cyan-600", success: "bg-success-50 text-success-600", warning: "bg-warning-50 text-warning-600", navy: "bg-navy-900/5 text-navy-900" };
  return (
    <div className="card p-4 sm:p-5">
      <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${tones[tone]}`}><IconCmp size={17} /></span>
      <p className="mt-3 text-2xl font-extrabold text-ink-900">{value}</p>
      <p className="text-xs text-ink-400 font-medium mt-0.5">{label}</p>
    </div>
  );
}

function Detail({ icon: IconCmp, label }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-300">
      <IconCmp size={15} /> {label}
    </span>
  );
}
