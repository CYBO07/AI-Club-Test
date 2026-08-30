import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useToast } from "../../context/ToastContext.jsx";
import { Icon } from "../../components/Icons.jsx";
import { TextInput, SelectInput } from "../../components/FormField.jsx";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

const YEARS = ["BCA 1st Year", "BCA 2nd Year", "BCA 3rd Year"];
const CATEGORIES = ["Computer Basics", "Logical Reasoning", "Problem Solving", "Programming", "DSA", "DBMS", "Web Development", "AI/ML", "Generative AI", "Cybersecurity", "Cloud/DevOps", "General Technology"];
const STEPS = ["Test Details", "Question Distribution", "Question Selection", "Review & Publish"];

const emptyForm = {
  name: "", year: "", duration: 30, numberOfQuestions: 30, totalMarks: 30, negativeMarking: 0,
  questionSelectionMode: "Random",
  difficultyConfiguration: { Easy: 0, Medium: 0, Hard: 0 },
  manualQuestionIds: [],
};

export default function TestBuilder() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);

  // manual selection browsing state
  const [pool, setPool] = useState([]);
  const [poolTotal, setPoolTotal] = useState(0);
  const [poolSearch, setPoolSearch] = useState("");
  const [poolCategory, setPoolCategory] = useState("");
  const [poolDifficulty, setPoolDifficulty] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]); // full objects, for preview

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/tests/${id}`).then(async (t) => {
      setForm({
        name: t.name, year: t.year, duration: t.duration, numberOfQuestions: t.numberOfQuestions,
        totalMarks: t.totalMarks, negativeMarking: t.negativeMarking || 0,
        questionSelectionMode: t.questionSelectionMode, difficultyConfiguration: t.difficultyConfiguration,
        manualQuestionIds: t.manualQuestionIds || [],
      });
      if (t.manualQuestionIds?.length) {
        const qs = await Promise.all(t.manualQuestionIds.map((qid) => api.get(`/questions/${qid}`)));
        setSelectedQuestions(qs);
      }
      setLoadingExisting(false);
    });
  }, [id]);

  useEffect(() => {
    if (form.questionSelectionMode !== "Manual" || !form.year) return;
    const params = new URLSearchParams({ year: form.year, status: "Active", search: poolSearch, category: poolCategory, difficulty: poolDifficulty, limit: 50 });
    api.get(`/questions?${params.toString()}`).then((d) => { setPool(d.data); setPoolTotal(d.total); });
  }, [form.questionSelectionMode, form.year, poolSearch, poolCategory, poolDifficulty]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function setDiff(level, value) { setForm((f) => ({ ...f, difficultyConfiguration: { ...f.difficultyConfiguration, [level]: Number(value) || 0 } })); }

  function toggleQuestion(q) {
    setForm((f) => {
      const has = f.manualQuestionIds.includes(q._id);
      const ids = has ? f.manualQuestionIds.filter((x) => x !== q._id) : [...f.manualQuestionIds, q._id];
      return { ...f, manualQuestionIds: ids };
    });
    setSelectedQuestions((qs) => {
      const has = qs.some((x) => x._id === q._id);
      return has ? qs.filter((x) => x._id !== q._id) : [...qs, q];
    });
  }

  const diffSum = form.difficultyConfiguration.Easy + form.difficultyConfiguration.Medium + form.difficultyConfiguration.Hard;

  function validateStep(s) {
    if (s === 0) {
      if (!form.name.trim()) return "Test name is required";
      if (!form.year) return "Academic year is required";
      if (!form.duration || form.duration <= 0) return "Duration must be greater than zero";
      if (!form.numberOfQuestions || form.numberOfQuestions < 1) return "Number of questions must be at least 1";
      if (!form.totalMarks || form.totalMarks < 1) return "Total marks must be at least 1";
    }
    if (s === 1 && diffSum > 0 && diffSum !== Number(form.numberOfQuestions)) {
      return `Difficulty split (${diffSum}) must add up to the number of questions (${form.numberOfQuestions})`;
    }
    if (s === 2 && form.questionSelectionMode === "Manual" && form.manualQuestionIds.length !== Number(form.numberOfQuestions)) {
      return `Select exactly ${form.numberOfQuestions} questions (currently ${form.manualQuestionIds.length})`;
    }
    return "";
  }

  function goNext() {
    const err = validateStep(step);
    if (err) return setError(err);
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() { setError(""); setStep((s) => Math.max(s - 1, 0)); }

  async function persist() {
    if (isEdit) return api.put(`/tests/${id}`, form);
    return api.post("/tests", form);
  }

  async function handleSaveDraft() {
    setBusy(true); setError("");
    try {
      const saved = await persist();
      toast.success("Test saved as draft");
      navigate(`/admin/tests/${saved._id || id}/edit`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    setBusy(true); setError("");
    try {
      const saved = await persist();
      const testId = saved._id || id;
      await api.patch(`/tests/${testId}/status`, { status: "Active" });
      toast.success("Test published and is now live for students");
      navigate("/admin/tests");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loadingExisting) return <p className="text-ink-400 text-sm">Loading test...</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/tests" className="btn-ghost px-2"><Icon.chevronLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{isEdit ? "Edit Test" : "Create Test"}</h1>
          <p className="text-ink-400 text-sm mt-0.5">Configure your recruitment test in four steps.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                i < step ? "bg-cyan-500 border-cyan-500 text-white" : i === step ? "border-cyan-500 text-cyan-600 bg-cyan-50" : "border-line text-ink-400"
              }`}>
                {i < step ? <Icon.check size={16} /> : i + 1}
              </div>
              <span className={`text-[11px] font-semibold hidden sm:block ${i === step ? "text-ink-900" : "text-ink-400"}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-cyan-500" : "bg-line"}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <TextInput label="Test Name" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="AI Club Recruitment Test 2026" />
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectInput label="Academic Year" required options={YEARS} value={form.year} onChange={(e) => set("year", e.target.value)} />
              <TextInput label="Duration (minutes)" required type="number" min={1} value={form.duration} onChange={(e) => set("duration", Number(e.target.value))} />
              <TextInput label="Total Questions" required type="number" min={1} value={form.numberOfQuestions} onChange={(e) => set("numberOfQuestions", Number(e.target.value))} />
              <TextInput label="Total Marks" required type="number" min={1} value={form.totalMarks} onChange={(e) => set("totalMarks", Number(e.target.value))} />
              <TextInput label="Negative Marking (per wrong answer)" type="number" min={0} step="0.25" value={form.negativeMarking} onChange={(e) => set("negativeMarking", Number(e.target.value))} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-ink-900">Difficulty distribution</h3>
              <p className="text-sm text-ink-400 mt-0.5">Optional — set how many questions of each difficulty to draw when using random selection. Leave all at 0 for pure random.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <TextInput label="Easy" type="number" min={0} value={form.difficultyConfiguration.Easy} onChange={(e) => setDiff("Easy", e.target.value)} />
              <TextInput label="Medium" type="number" min={0} value={form.difficultyConfiguration.Medium} onChange={(e) => setDiff("Medium", e.target.value)} />
              <TextInput label="Hard" type="number" min={0} value={form.difficultyConfiguration.Hard} onChange={(e) => setDiff("Hard", e.target.value)} />
            </div>
            <div className="rounded-xl bg-navy-950 text-white p-4 flex items-center justify-center gap-3 font-mono text-sm font-semibold">
              <span>{form.numberOfQuestions} Questions</span><span className="text-slate-500">|</span>
              <span>{form.totalMarks} Marks</span><span className="text-slate-500">|</span>
              <span>{form.duration} Minutes</span>
            </div>
            {diffSum > 0 && diffSum !== Number(form.numberOfQuestions) && (
              <p className="text-sm text-danger-600 bg-danger-50 border border-danger-500/20 rounded-xl px-3.5 py-2.5">Difficulty split totals {diffSum}, but the test needs {form.numberOfQuestions} questions.</p>
            )}
            <p className="text-xs text-ink-400">Need to target specific categories (e.g. more AI/ML, fewer DSA)? Use Manual Question Selection in the next step.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-ink-900">Question selection</h3>
              <p className="text-sm text-ink-400 mt-0.5">Choose how questions are pulled for this test.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <button onClick={() => set("questionSelectionMode", "Random")} className={`text-left rounded-xl border-2 p-4 transition ${form.questionSelectionMode === "Random" ? "border-cyan-500 bg-cyan-50" : "border-line"}`}>
                <p className="font-bold text-ink-900">Automatic (Random)</p>
                <p className="text-xs text-ink-400 mt-1">The system randomly draws active questions for {form.year || "the selected year"}, honoring your difficulty split.</p>
              </button>
              <button onClick={() => set("questionSelectionMode", "Manual")} className={`text-left rounded-xl border-2 p-4 transition ${form.questionSelectionMode === "Manual" ? "border-cyan-500 bg-cyan-50" : "border-line"}`}>
                <p className="font-bold text-ink-900">Manual Selection</p>
                <p className="text-xs text-ink-400 mt-1">Hand-pick the exact {form.numberOfQuestions} questions for this test.</p>
              </button>
            </div>

            {form.questionSelectionMode === "Manual" && (
              <div className="space-y-3 pt-2 border-t border-line">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-semibold text-ink-900">
                    {form.manualQuestionIds.length} / {form.numberOfQuestions} selected
                  </p>
                  {!form.year && <p className="text-xs text-danger-600">Set an academic year in Step 1 first.</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Icon.search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input value={poolSearch} onChange={(e) => setPoolSearch(e.target.value)} placeholder="Search questions..." className="input pl-9 py-2 text-sm" />
                  </div>
                  <select value={poolCategory} onChange={(e) => setPoolCategory(e.target.value)} className="input bg-white w-auto py-2 text-sm"><option value="">All Categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                  <select value={poolDifficulty} onChange={(e) => setPoolDifficulty(e.target.value)} className="input bg-white w-auto py-2 text-sm"><option value="">All Difficulties</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin border border-line rounded-xl divide-y divide-line">
                  {pool.length === 0 && <EmptyState title="No active questions found" description="Try a different search or add questions to the bank first." />}
                  {pool.map((q) => {
                    const checked = form.manualQuestionIds.includes(q._id);
                    return (
                      <label key={q._id} className={`flex items-start gap-3 p-3 cursor-pointer transition ${checked ? "bg-cyan-50" : "hover:bg-slate-50"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleQuestion(q)} className="mt-1" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-ink-900 truncate">{q.question}</p>
                          <div className="flex items-center gap-2 mt-1"><Badge>{q.difficulty}</Badge><span className="text-xs text-ink-400">{q.category}</span></div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-ink-400">Showing {pool.length} of {poolTotal} active questions for {form.year}.</p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h3 className="font-bold text-ink-900">Review configuration</h3>
            <dl className="grid sm:grid-cols-2 gap-3">
              <ReviewRow label="Test Name" value={form.name} />
              <ReviewRow label="Academic Year" value={form.year} />
              <ReviewRow label="Duration" value={`${form.duration} minutes`} />
              <ReviewRow label="Questions" value={form.numberOfQuestions} />
              <ReviewRow label="Total Marks" value={form.totalMarks} />
              <ReviewRow label="Negative Marking" value={form.negativeMarking || "None"} />
              <ReviewRow label="Selection Mode" value={form.questionSelectionMode} />
              <ReviewRow label="Difficulty Split" value={diffSum > 0 ? `E:${form.difficultyConfiguration.Easy} M:${form.difficultyConfiguration.Medium} H:${form.difficultyConfiguration.Hard}` : "Pure random"} />
            </dl>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-ink-600">
              <p><b>Save Draft</b> stores this configuration without making it visible to students.</p>
              <p className="mt-1"><b>Publish Test</b> saves and immediately activates it — the backend will verify there are enough active questions before going live.</p>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-danger-600 bg-danger-50 border border-danger-500/20 rounded-xl px-3.5 py-2.5">{error}</p>}

        <div className="mt-7 flex items-center justify-between">
          <button onClick={goBack} disabled={step === 0} className="btn-outline disabled:opacity-40"><Icon.chevronLeft size={16} /> Back</button>
          <div className="flex gap-3">
            {step === STEPS.length - 1 ? (
              <>
                <button onClick={handleSaveDraft} disabled={busy} className="btn-outline">{busy ? "Saving..." : "Save Draft"}</button>
                <button onClick={handlePublish} disabled={busy} className="btn-accent">{busy ? "Publishing..." : "Publish Test"}</button>
              </>
            ) : (
              <button onClick={goNext} className="btn-primary">Next <Icon.chevronRight size={16} /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3">
      <dt className="text-xs text-ink-400 font-medium">{label}</dt>
      <dd className="font-semibold text-ink-900 mt-0.5">{value}</dd>
    </div>
  );
}
