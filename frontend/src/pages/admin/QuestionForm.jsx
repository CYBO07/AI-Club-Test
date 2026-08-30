import React, { useState } from "react";
import { api } from "../../api/client.js";
import { TextInput, SelectInput, TextArea } from "../../components/FormField.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const YEARS = ["BCA 1st Year", "BCA 2nd Year", "BCA 3rd Year"];
const CATEGORIES = ["Computer Basics", "Logical Reasoning", "Problem Solving", "Programming", "DSA", "DBMS", "Web Development", "AI/ML", "Generative AI", "Cybersecurity", "Cloud/DevOps", "General Technology"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function QuestionForm({ question, onDone, onCancel }) {
  const isEdit = !!question;
  const toast = useToast();
  const [form, setForm] = useState({
    question: question?.question || "",
    options: { A: question?.options?.A || "", B: question?.options?.B || "", C: question?.options?.C || "", D: question?.options?.D || "" },
    correctAnswer: question?.correctAnswer || "",
    year: question?.year || "",
    category: question?.category || "",
    difficulty: question?.difficulty || "",
    marks: question?.marks || 1,
    explanation: question?.explanation || "",
    status: question?.status || "Active",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function setOption(letter, value) { setForm((f) => ({ ...f, options: { ...f.options, [letter]: value } })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isEdit) await api.put(`/questions/${question._id}`, form);
      else await api.post("/questions", form);
      toast.success(isEdit ? "Question updated" : "Question added to the bank");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextArea label="Question" required rows={3} value={form.question} onChange={(e) => set("question", e.target.value)} />

      <div className="grid sm:grid-cols-2 gap-4">
        {["A", "B", "C", "D"].map((letter) => (
          <TextInput key={letter} label={`Option ${letter}`} required value={form.options[letter]} onChange={(e) => setOption(letter, e.target.value)} />
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <SelectInput label="Correct Answer" required options={["A", "B", "C", "D"]} value={form.correctAnswer} onChange={(e) => set("correctAnswer", e.target.value)} />
        <TextInput label="Marks" required type="number" min={1} value={form.marks} onChange={(e) => set("marks", Number(e.target.value))} />
        <SelectInput label="Academic Year" required options={YEARS} value={form.year} onChange={(e) => set("year", e.target.value)} />
        <SelectInput label="Category" required options={CATEGORIES} value={form.category} onChange={(e) => set("category", e.target.value)} />
        <SelectInput label="Difficulty" required options={DIFFICULTIES} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} />
        <SelectInput label="Status" required options={["Active", "Inactive"]} value={form.status} onChange={(e) => set("status", e.target.value)} />
      </div>

      <TextArea label="Explanation (optional)" rows={2} value={form.explanation} onChange={(e) => set("explanation", e.target.value)} />

      {error && <p className="text-sm text-danger-600 bg-danger-50 border border-danger-500/20 rounded-xl px-3.5 py-2.5">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving..." : "Save Question"}</button>
      </div>
    </form>
  );
}
