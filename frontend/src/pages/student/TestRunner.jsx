import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { useToast } from "../../context/ToastContext.jsx";
import { Icon } from "../../components/Icons.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

function useCountdown(expiresAt, onExpire, onLowTime) {
  const [remaining, setRemaining] = useState(0);
  const firedRef = useRef(false);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!expiresAt) return;
    function tick() {
      const ms = new Date(expiresAt).getTime() - Date.now();
      const secs = Math.max(0, Math.floor(ms / 1000));
      setRemaining(secs);
      if (secs <= 60 && secs > 0 && !warnedRef.current) { warnedRef.current = true; onLowTime?.(); }
      if (secs <= 0 && !firedRef.current) { firedRef.current = true; onExpire(); }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}

const STATUS = { ANSWERED: "answered", REVIEW: "review", UNANSWERED: "unanswered" };

export default function TestRunner() {
  const navigate = useNavigate();
  const toast = useToast();
  const [state, setState] = useState(null);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({}); // client-side "mark for review" flags
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function boot() {
      try {
        const data = await api.get("/attempts/available");
        if (!data.test) { navigate("/dashboard"); return; }
        const started = await api.post("/attempts/start", { testId: data.test.id });
        setState({ ...started, totalMarks: data.test.totalMarks });
        const map = {};
        started.answers.forEach((a) => { map[a.questionId] = a.selectedOption; });
        setAnswers(map);
      } catch (err) {
        toast.error(err.message);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, []);

  // Warn before accidental navigation/close while a test is in progress.
  useEffect(() => {
    function beforeUnload(e) { e.preventDefault(); e.returnValue = ""; }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  async function doSubmit(auto = false) {
    if (!state) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/attempts/${state.attemptId}/submit`, {});
      navigate("/result", { state: { summary: res.summary, auto } });
    } catch (err) {
      toast.error(err.message);
      setSubmitting(false);
    }
  }

  const remaining = useCountdown(
    state?.expiresAt,
    () => doSubmit(true),
    () => toast.info("Less than a minute remaining — your test will auto-submit at zero.")
  );

  async function selectOption(questionId, option) {
    setAnswers((a) => ({ ...a, [questionId]: option }));
    try {
      await api.patch(`/attempts/${state.attemptId}/answer`, { questionId, selectedOption: option });
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function clearAnswer(questionId) {
    setAnswers((a) => ({ ...a, [questionId]: null }));
    try {
      await api.patch(`/attempts/${state.attemptId}/answer`, { questionId, selectedOption: null });
    } catch (err) {
      toast.error(err.message);
    }
  }

  function toggleMark(questionId) {
    setMarked((m) => ({ ...m, [questionId]: !m[questionId] }));
  }

  const totalQuestions = state?.questions?.length || 0;
  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-center text-white">
          <div className="h-10 w-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Preparing your test...</p>
        </div>
      </div>
    );
  }
  if (!state) return null;

  const mins = Math.floor(remaining / 60).toString().padStart(2, "0");
  const secs = (remaining % 60).toString().padStart(2, "0");
  const isLow = remaining <= 60;
  const q = state.questions[current];
  const progressPct = Math.round(((current + 1) / totalQuestions) * 100);

  const OPTIONS = [["A", q.optionA], ["B", q.optionB], ["C", q.optionC], ["D", q.optionD]];

  function statusFor(qq) {
    if (marked[qq.questionId]) return STATUS.REVIEW;
    if (answers[qq.questionId]) return STATUS.ANSWERED;
    return STATUS.UNANSWERED;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Distraction-free top bar */}
      <header className="sticky top-0 z-20 bg-navy-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-cyan-500 flex items-center justify-center font-extrabold text-navy-950 text-xs shrink-0">AI</div>
            <p className="text-sm font-bold truncate">AI CLUB <span className="text-slate-400 font-medium">| Recruitment Test</span></p>
          </div>
          <div className={`flex items-center gap-2 font-mono font-bold text-lg shrink-0 ${isLow ? "text-danger-400 animate-pulse" : "text-white"}`}>
            <Icon.clock size={17} />
            {mins}:{secs}
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Question {current + 1} of {totalQuestions}</span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-1.5 rounded-full bg-cyan-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
        {/* Question navigator */}
        <div className="flex flex-wrap gap-2">
          {state.questions.map((qq, i) => {
            const s = statusFor(qq);
            const cls =
              i === current ? "bg-navy-950 text-white ring-2 ring-cyan-400" :
              s === STATUS.REVIEW ? "bg-warning-50 text-warning-600 border border-warning-500/30" :
              s === STATUS.ANSWERED ? "bg-success-50 text-success-600 border border-success-500/30" :
              "bg-white text-ink-400 border border-line";
            return (
              <button key={qq.questionId} onClick={() => setCurrent(i)} className={`focus-ring h-9 w-9 rounded-lg text-xs font-mono font-bold transition ${cls}`}>
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-ink-400">
          <Legend swatch="bg-success-50 border border-success-500/30" label="Answered" />
          <Legend swatch="bg-warning-50 border border-warning-500/30" label="Marked for review" />
          <Legend swatch="bg-white border border-line" label="Unanswered" />
        </div>

        {/* Question card */}
        <div className="card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-semibold text-ink-400">Question {current + 1} · {q.marks} mark{q.marks > 1 ? "s" : ""}</span>
            {marked[q.questionId] && <span className="text-xs font-semibold text-warning-600 flex items-center gap-1"><Icon.flag size={13} /> Marked</span>}
          </div>
          <p className="text-lg sm:text-xl font-semibold text-ink-900 leading-relaxed">{q.question}</p>

          <div className="mt-6 space-y-3">
            {OPTIONS.map(([letter, text]) => {
              const selected = answers[q.questionId] === letter;
              return (
                <button
                  key={letter}
                  onClick={() => selectOption(q.questionId, letter)}
                  className={`focus-ring w-full flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition ${
                    selected ? "border-cyan-500 bg-cyan-50" : "border-line hover:border-cyan-500/40 hover:bg-slate-50"
                  }`}
                >
                  <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${selected ? "bg-cyan-500 text-white" : "bg-slate-100 text-ink-600"}`}>
                    {letter}
                  </span>
                  <span className="text-[15px] text-ink-900 pt-0.5">{text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button disabled={current === 0} onClick={() => setCurrent((c) => c - 1)} className="btn-outline disabled:opacity-40">
            <Icon.chevronLeft size={16} /> Previous
          </button>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => toggleMark(q.questionId)} className="btn-outline">
              <Icon.flag size={15} /> {marked[q.questionId] ? "Unmark" : "Mark for Review"}
            </button>
            <button onClick={() => clearAnswer(q.questionId)} disabled={!answers[q.questionId]} className="btn-outline disabled:opacity-40">
              <Icon.x size={15} /> Clear Answer
            </button>
          </div>
          {current < totalQuestions - 1 ? (
            <button onClick={() => setCurrent((c) => c + 1)} className="btn-primary">Next <Icon.chevronRight size={16} /></button>
          ) : (
            <button onClick={() => setConfirmSubmit(true)} className="btn-accent">Submit Test</button>
          )}
        </div>

        <div className="text-center pt-2">
          <button onClick={() => setConfirmSubmit(true)} className="focus-ring text-xs font-semibold text-danger-600 hover:underline">
            Submit test now
          </button>
        </div>
      </main>

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit your test?"
        message={`You have answered ${answeredCount} of ${totalQuestions} questions${Object.values(marked).some(Boolean) ? `, with ${Object.values(marked).filter(Boolean).length} marked for review` : ""}. Once submitted, you cannot make further changes.`}
        confirmLabel={submitting ? "Submitting..." : "Submit"}
        onConfirm={() => doSubmit(false)}
        onCancel={() => setConfirmSubmit(false)}
      />
    </div>
  );
}

function Legend({ swatch, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${swatch}`} /> {label}
    </span>
  );
}
