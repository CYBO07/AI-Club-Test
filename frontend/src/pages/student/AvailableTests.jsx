import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { useToast } from "../../context/ToastContext.jsx";
import { Icon } from "../../components/Icons.jsx";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { SkeletonCard } from "../../components/Skeleton.jsx";

export default function AvailableTests() {
  const [available, setAvailable] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    api.get("/attempts/available").then(setAvailable).finally(() => setLoading(false));
  }, []);

  async function handleStart(testId) {
    setStarting(true);
    try {
      await api.post("/attempts/start", { testId });
      navigate("/test");
    } catch (err) {
      toast.error(err.message);
      setStarting(false);
    }
  }

  const tests = available?.test ? [available.test] : [];
  const filtered = tests.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Available Tests</h1>
        <p className="text-ink-400 mt-1">Tests configured by the administrator for your academic year.</p>
      </div>

      <div className="relative max-w-sm">
        <Icon.search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tests..." className="input pl-10" />
      </div>

      {loading && <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>}

      {!loading && filtered.length === 0 && (
        <div className="card">
          <EmptyState icon={<Icon.tests size={22} />} title="No tests found" description={available?.message || "No questions have been added for this test yet. Please contact the administrator."} />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((t) => (
          <div key={t.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-ink-900">{t.name}</h3>
              <Badge>{available.attemptStatus === "InProgress" ? "In Progress" : available.attemptStatus ? "Completed" : "Available"}</Badge>
            </div>
            <p className="text-xs text-ink-400 mt-1">{t.year}</p>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><dt className="text-ink-400 text-xs">Questions</dt><dd className="font-bold text-ink-900">{t.numberOfQuestions}</dd></div>
              <div><dt className="text-ink-400 text-xs">Duration</dt><dd className="font-bold text-ink-900">{t.duration}m</dd></div>
              <div><dt className="text-ink-400 text-xs">Marks</dt><dd className="font-bold text-ink-900">{t.totalMarks}</dd></div>
            </dl>
            <div className="mt-5">
              {available.attemptStatus === "InProgress" ? (
                <button onClick={() => handleStart(t.id)} disabled={starting} className="btn-accent w-full">Continue Test</button>
              ) : available.attemptStatus ? (
                <button disabled className="btn-outline w-full opacity-60">Already Completed</button>
              ) : (
                <button onClick={() => handleStart(t.id)} disabled={starting} className="btn-accent w-full">
                  {starting ? "Starting..." : "Start Test"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
