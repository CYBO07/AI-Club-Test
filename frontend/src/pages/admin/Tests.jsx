import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import Badge from "../../components/Badge.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { SkeletonCard } from "../../components/Skeleton.jsx";
import { Icon } from "../../components/Icons.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function Tests() {
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [participants, setParticipants] = useState({}); // testId -> count
  const [studentTotals, setStudentTotals] = useState({}); // year -> total students
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [activationError, setActivationError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await api.get("/tests");
    setTests(list);

    const years = [...new Set(list.map((t) => t.year))];
    const totals = {};
    await Promise.all(years.map(async (y) => {
      const d = await api.get(`/students?year=${encodeURIComponent(y)}&limit=1`);
      totals[y] = d.total;
    }));
    setStudentTotals(totals);

    const partEntries = await Promise.all(list.map(async (t) => {
      const results = await api.get(`/results?testId=${t._id}`);
      return [t._id, results.length];
    }));
    setParticipants(Object.fromEntries(partEntries));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(test, status) {
    setActivationError(null);
    try {
      await api.patch(`/tests/${test._id}/status`, { status });
      toast.success(`Test ${status.toLowerCase()}`);
      load();
    } catch (err) {
      if (status === "Active") setActivationError({ test, message: err.message });
      else toast.error(err.message);
    }
  }

  async function duplicateTest(t) {
    await api.post("/tests", {
      name: `${t.name} (copy)`, year: t.year, duration: t.duration, numberOfQuestions: t.numberOfQuestions,
      totalMarks: t.totalMarks, negativeMarking: t.negativeMarking, questionSelectionMode: t.questionSelectionMode,
      difficultyConfiguration: t.difficultyConfiguration, manualQuestionIds: t.questionSelectionMode === "Manual" ? t.manualQuestionIds : [],
    });
    toast.success("Test duplicated as a new draft");
    load();
  }

  function askDelete(t) {
    setConfirm({
      title: "Delete draft test?",
      message: `"${t.name}" will be permanently removed. This is only possible while the test is a Draft.`,
      onConfirm: async () => { await api.del(`/tests/${t._id}`); toast.success("Test deleted"); setConfirm(null); load(); },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Tests</h1>
          <p className="text-ink-400 mt-1 text-sm">Create, validate, and publish the recruitment test for each year.</p>
        </div>
        <Link to="/admin/tests/new" className="btn-primary"><Icon.plus size={16} /> Create Test</Link>
      </div>

      {activationError && (
        <div className="rounded-2xl bg-danger-50 border border-danger-500/20 p-4 text-sm text-danger-700">
          <p className="font-bold flex items-center gap-2"><Icon.alert size={15} /> Cannot activate "{activationError.test.name}"</p>
          <p className="mt-1">{activationError.message}</p>
        </div>
      )}

      {loading && <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>}

      {!loading && tests.length === 0 && (
        <div className="card">
          <EmptyState icon={<Icon.tests size={22} />} title="No tests created yet" description="Create your first test to start recruiting." action={<Link to="/admin/tests/new" className="btn-primary"><Icon.plus size={16} /> Create Test</Link>} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {tests.map((t) => {
          const total = studentTotals[t.year] || 0;
          const done = participants[t._id] || 0;
          const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={t._id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-ink-900">{t.name}</h3>
                  <p className="text-sm text-ink-400">{t.year} · Created {new Date(t.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <Badge dot>{t.status}</Badge>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-ink-400">Questions</dt><dd className="text-ink-900 font-semibold">{t.numberOfQuestions}</dd>
                <dt className="text-ink-400">Duration</dt><dd className="text-ink-900 font-semibold">{t.duration} min</dd>
                <dt className="text-ink-400">Participants</dt><dd className="text-ink-900 font-semibold">{done} / {total}</dd>
                <dt className="text-ink-400">Completion Rate</dt><dd className="text-ink-900 font-semibold">{completionRate}%</dd>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                {(t.status === "Draft" || t.status === "Paused") && (
                  <>
                    <Link to={`/admin/tests/${t._id}/edit`} className="btn-outline px-3 py-1.5"><Icon.edit size={13} /> Edit</Link>
                    <button onClick={() => changeStatus(t, "Active")} className="btn-accent px-3 py-1.5">Activate</button>
                  </>
                )}
                {t.status === "Active" && (
                  <>
                    <Link to={`/admin/tests/${t._id}/edit`} className="btn-outline px-3 py-1.5"><Icon.eye size={13} /> View</Link>
                    <button onClick={() => changeStatus(t, "Paused")} className="px-3 py-1.5 rounded-xl bg-warning-500 text-white hover:bg-warning-600">Pause</button>
                    <button onClick={() => changeStatus(t, "Closed")} className="px-3 py-1.5 rounded-xl bg-danger-500 text-white hover:bg-danger-600">Close</button>
                  </>
                )}
                {t.status === "Closed" && <Link to={`/admin/tests/${t._id}/edit`} className="btn-outline px-3 py-1.5"><Icon.eye size={13} /> View</Link>}
                <button onClick={() => duplicateTest(t)} className="btn-outline px-3 py-1.5">Duplicate</button>
                {t.status === "Draft" && <button onClick={() => askDelete(t)} className="px-3 py-1.5 rounded-xl border border-danger-500/30 text-danger-600 hover:bg-danger-50">Delete</button>}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} confirmLabel="Delete" danger onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />
    </div>
  );
}
