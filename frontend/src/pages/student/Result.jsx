import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Icon } from "../../components/Icons.jsx";
import DonutChart from "../../components/charts/DonutChart.jsx";

export default function Result() {
  const { state } = useLocation();
  const summary = state?.summary;

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="card p-10 text-center max-w-sm">
          <p className="text-ink-600">No recent submission found.</p>
          <Link to="/dashboard" className="btn-accent inline-flex mt-5">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const pct = summary.totalMarks > 0 ? Math.round((summary.score / summary.totalMarks) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-success-50 text-success-600 flex items-center justify-center mx-auto mb-4">
            <Icon.check size={28} />
          </div>
          <p className="text-xs font-bold tracking-widest text-cyan-600 uppercase">Test Complete</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 mt-1">
            {state?.auto ? "Time expired — submitted automatically" : "Your test has been submitted"}
          </h1>
        </div>

        <div className="card p-8 text-center">
          <DonutChart
            size={180}
            thickness={16}
            centerValue={`${pct}%`}
            centerLabel={`${summary.score}/${summary.totalMarks}`}
            segments={[
              { label: "Score", value: pct, color: pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444" },
              { label: "Remaining", value: 100 - pct, color: "#F1F5F9" },
            ]}
          />

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Metric label="Correct" value={summary.correct} tone="text-success-600" bg="bg-success-50" />
            <Metric label="Wrong" value={summary.wrong} tone="text-danger-600" bg="bg-danger-50" />
            <Metric label="Unanswered" value={summary.unanswered} tone="text-ink-600" bg="bg-slate-100" />
          </div>
        </div>

        <p className="text-center text-sm text-ink-400 mt-6">
          Results are reviewed by the AI Club administrator. You'll be notified separately about next steps.
        </p>

        <Link to="/my-results" className="btn-primary w-full mt-4">View detailed results</Link>
      </div>
    </div>
  );
}

function Metric({ label, value, tone, bg }) {
  return (
    <div className={`rounded-xl py-3.5 ${bg}`}>
      <p className={`text-xl font-extrabold ${tone}`}>{value}</p>
      <p className="text-[11px] text-ink-400 font-medium mt-0.5">{label}</p>
    </div>
  );
}
