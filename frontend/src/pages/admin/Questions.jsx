import React, { useEffect, useState, useCallback } from "react";
import { api, downloadBlob } from "../../api/client.js";
import Badge from "../../components/Badge.jsx";
import Modal from "../../components/Modal.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { SkeletonTableRows } from "../../components/Skeleton.jsx";
import { Icon } from "../../components/Icons.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import QuestionForm from "./QuestionForm.jsx";
import QuestionImport from "./QuestionImport.jsx";

const YEARS = ["BCA 1st Year", "BCA 2nd Year", "BCA 3rd Year"];
const CATEGORIES = ["Computer Basics", "Logical Reasoning", "Problem Solving", "Programming", "DSA", "DBMS", "Web Development", "AI/ML", "Generative AI", "Cybersecurity", "Cloud/DevOps", "General Technology"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function Questions() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  const [active, setActive] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, year, category, difficulty, status, page, limit: 10 });
    const data = await api.get(`/questions?${params.toString()}`);
    setRows(data.data); setTotal(data.total); setTotalPages(data.totalPages);
    setLoading(false);
  }, [search, year, category, difficulty, status, page]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setActive(null); setModal("add"); }
  function openEdit(q) { setActive(q); setModal("edit"); }
  function closeModal() { setModal(null); load(); }

  async function toggleStatus(q) {
    await api.patch(`/questions/${q._id}/status`, { status: q.status === "Active" ? "Inactive" : "Active" });
    toast.success(`Question ${q.status === "Active" ? "deactivated" : "activated"}`);
    load();
  }

  async function duplicateQuestion(q) {
    await api.post("/questions", {
      question: `${q.question} (copy)`, options: q.options, correctAnswer: q.correctAnswer,
      year: q.year, category: q.category, difficulty: q.difficulty, marks: q.marks, explanation: q.explanation, status: "Inactive",
    });
    toast.success("Question duplicated as Inactive — review and activate it");
    load();
  }

  function askDelete(q) {
    setConfirm({
      title: "Delete question?",
      message: "This permanently removes the question from the bank. Tests already taken are unaffected.",
      onConfirm: async () => { await api.del(`/questions/${q._id}`); toast.success("Question deleted"); setConfirm(null); load(); },
    });
  }

  async function exportCsv() {
    const params = new URLSearchParams({ year, category, difficulty, status });
    const blob = await api.getBlob(`/questions/export?${params.toString()}`);
    downloadBlob(blob, "question_bank_export.csv");
  }

  const hasFilters = search || year || category || difficulty || status;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Question Bank</h1>
          <p className="text-ink-400 mt-1 text-sm">{total} question{total === 1 ? "" : "s"} in the bank.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCsv} className="btn-outline"><Icon.download size={16} /> Export</button>
          <button onClick={() => setModal("import")} className="btn-outline"><Icon.upload size={16} /> Import</button>
          <button onClick={openAdd} className="btn-primary"><Icon.plus size={16} /> Add Question</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Icon.search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search question text..." className="input pl-10" />
        </div>
        <select value={year} onChange={(e) => { setPage(1); setYear(e.target.value); }} className="input bg-white w-auto"><option value="">All Years</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select>
        <select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }} className="input bg-white w-auto"><option value="">All Categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select value={difficulty} onChange={(e) => { setPage(1); setDifficulty(e.target.value); }} className="input bg-white w-auto"><option value="">All Difficulties</option>{DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}</select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="input bg-white w-auto"><option value="">All Statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-400 border-b border-line">
              <th className="p-3.5 font-semibold">Question</th><th className="p-3.5 font-semibold">Year</th><th className="p-3.5 font-semibold">Category</th>
              <th className="p-3.5 font-semibold">Difficulty</th><th className="p-3.5 font-semibold">Marks</th><th className="p-3.5 font-semibold">Status</th><th className="p-3.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <SkeletonTableRows rows={6} cols={7} />}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7}>
                <EmptyState icon={<Icon.bank size={22} />} title={hasFilters ? "No questions match your filters" : "No questions yet"} description={hasFilters ? "Try adjusting your search or filters." : "Add your first question to build the bank."} action={!hasFilters && <button onClick={openAdd} className="btn-primary"><Icon.plus size={16} /> Add Question</button>} />
              </td></tr>
            )}
            {rows.map((q) => (
              <tr key={q._id} className="hover:bg-slate-50 transition">
                <td className="p-3.5 max-w-sm truncate text-ink-900 font-medium">{q.question}</td>
                <td className="p-3.5 text-ink-600 whitespace-nowrap">{q.year}</td>
                <td className="p-3.5 text-ink-600">{q.category}</td>
                <td className="p-3.5"><Badge>{q.difficulty}</Badge></td>
                <td className="p-3.5 font-mono text-xs text-ink-600">{q.marks}</td>
                <td className="p-3.5"><Badge dot>{q.status}</Badge></td>
                <td className="p-3.5">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                    <button onClick={() => setViewing(q)} className="text-ink-600 hover:underline">View</button>
                    <button onClick={() => openEdit(q)} className="text-cyan-600 hover:underline">Edit</button>
                    <button onClick={() => duplicateQuestion(q)} className="text-ink-600 hover:underline">Duplicate</button>
                    <button onClick={() => toggleStatus(q)} className="text-warning-600 hover:underline">{q.status === "Active" ? "Deactivate" : "Activate"}</button>
                    <button onClick={() => askDelete(q)} className="text-danger-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-outline px-3 py-1.5 disabled:opacity-40">Prev</button>
          <span className="text-sm text-ink-400">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-outline px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}

      <Modal open={modal === "add"} title="Add Question" onClose={closeModal} wide><QuestionForm onDone={closeModal} onCancel={closeModal} /></Modal>
      <Modal open={modal === "edit"} title="Edit Question" onClose={closeModal} wide><QuestionForm question={active} onDone={closeModal} onCancel={closeModal} /></Modal>
      <Modal open={modal === "import"} title="Bulk Import Questions" onClose={closeModal} wide><QuestionImport onDone={closeModal} /></Modal>

      <Modal open={!!viewing} title="Question Details" onClose={() => setViewing(null)} wide>
        {viewing && (
          <div className="space-y-4">
            <p className="text-ink-900 font-medium">{viewing.question}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {["A", "B", "C", "D"].map((letter) => (
                <div key={letter} className={`rounded-xl border p-3 text-sm ${viewing.correctAnswer === letter ? "border-success-500 bg-success-50" : "border-line"}`}>
                  <span className="font-mono font-bold mr-2">{letter}.</span>{viewing.options[letter]}
                  {viewing.correctAnswer === letter && <Icon.check size={14} className="inline ml-2 text-success-600" />}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{viewing.difficulty}</Badge><Badge dot>{viewing.status}</Badge>
              <span className="text-xs text-ink-400 self-center">{viewing.year} · {viewing.category} · {viewing.marks} mark{viewing.marks > 1 ? "s" : ""}</span>
            </div>
            {viewing.explanation && <p className="text-sm text-ink-600 bg-slate-50 rounded-xl p-3.5">{viewing.explanation}</p>}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} confirmLabel="Delete" danger onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />
    </div>
  );
}
