import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Icon } from "../../components/Icons.jsx";
import ProgressBar from "../../components/ProgressBar.jsx";
import { SkeletonCard } from "../../components/Skeleton.jsx";

const CATEGORIES = ["Computer Basics", "Logical Reasoning", "Problem Solving", "Programming", "DSA", "DBMS", "Web Development", "AI/ML", "Generative AI", "Cybersecurity", "Cloud/DevOps", "General Technology"];
const YEARS = ["BCA 1st Year", "BCA 2nd Year", "BCA 3rd Year"];

export default function Categories() {
  const [counts, setCounts] = useState(null); // { category: { total, active } }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const entries = await Promise.all(
        CATEGORIES.map(async (cat) => {
          const [all, active] = await Promise.all([
            api.get(`/questions?category=${encodeURIComponent(cat)}&limit=1`),
            api.get(`/questions?category=${encodeURIComponent(cat)}&status=Active&limit=1`),
          ]);
          return [cat, { total: all.total, active: active.total }];
        })
      );
      setCounts(Object.fromEntries(entries));
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !counts) return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  const grandTotal = Object.values(counts).reduce((s, c) => s + c.total, 0);
  const maxCount = Math.max(1, ...Object.values(counts).map((c) => c.total));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Categories</h1>
        <p className="text-ink-400 mt-1 text-sm">{grandTotal} question{grandTotal === 1 ? "" : "s"} across {CATEGORIES.length} categories. Categories are defined by the question schema and applied when adding questions.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const c = counts[cat];
          return (
            <div key={cat} className="card p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-ink-900 text-sm">{cat}</h3>
                <span className="h-8 w-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0"><Icon.categories size={15} /></span>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-ink-900">{c.total}</p>
              <p className="text-xs text-ink-400">{c.active} active</p>
              <div className="mt-3">
                <ProgressBar value={c.total} max={maxCount} tone="cyan" showValue={false} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
