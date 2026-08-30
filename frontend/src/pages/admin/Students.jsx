import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../api/client.js";
import Badge from "../../components/Badge.jsx";
import Modal from "../../components/Modal.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { SkeletonTableRows } from "../../components/Skeleton.jsx";
import { Icon } from "../../components/Icons.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import StudentForm from "./StudentForm.jsx";
import StudentImport from "./StudentImport.jsx";

const YEARS = ["BCA 1st Year", "BCA 2nd Year", "BCA 3rd Year"];

export default function Students() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [testStatus, setTestStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  const [activeStudent, setActiveStudent] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [resetResult, setResetResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, year, status, testStatus, page, limit: 10 });
    const data = await api.get(`/students?${params.toString()}`);
    setRows(data.data); setTotal(data.total); setTotalPages(data.totalPages);
    setLoading(false);
  }, [search, year, status, testStatus, page]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setActiveStudent(null); setModal("add"); }
  function openEdit(s) { setActiveStudent(s); setModal("edit"); }
  function closeModal() { setModal(null); load(); }

  async function toggleStatus(s) {
    await api.patch(`/students/${s._id}/status`, { status: s.status === "Active" ? "Disabled" : "Active" });
    toast.success(`${s.fullName} ${s.status === "Active" ? "disabled" : "enabled"}`);
    load();
  }

  async function handleResetPassword(s) {
    const res = await api.post(`/students/${s._id}/reset-password`, { generatePassword: true });
    setResetResult({ student: s, password: res.temporaryPassword });
  }

  function askDelete(s) {
    setConfirm({
      title: "Delete student account?",
      message: `This permanently deletes ${s.fullName} (${s.rollNumber}) and their test history. This cannot be undone.`,
      onConfirm: async () => { await api.del(`/students/${s._id}`); toast.success("Student deleted"); setConfirm(null); load(); },
    });
  }

  const hasFilters = search || year || status || testStatus;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Students</h1>
          <p className="text-ink-400 mt-1 text-sm">{total} account{total === 1 ? "" : "s"} on file — created and managed only by the administrator.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModal("import")} className="btn-outline"><Icon.upload size={16} /> Import</button>
          <button onClick={openAdd} className="btn-primary"><Icon.plus size={16} /> Add Student</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Icon.search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search name, roll no, email, username..." className="input pl-10" />
        </div>
        <select value={year} onChange={(e) => { setPage(1); setYear(e.target.value); }} className="input bg-white w-auto"><option value="">All Years</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="input bg-white w-auto"><option value="">All Statuses</option><option value="Active">Active</option><option value="Disabled">Disabled</option></select>
        <select value={testStatus} onChange={(e) => { setPage(1); setTestStatus(e.target.value); }} className="input bg-white w-auto"><option value="">All Test Status</option><option value="Not Attempted">Not Attempted</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option></select>
      </div>

      <div className="card overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-400 border-b border-line">
              <th className="p-3.5 font-semibold">Name</th><th className="p-3.5 font-semibold">Roll No.</th><th className="p-3.5 font-semibold">Username</th>
              <th className="p-3.5 font-semibold">Email</th><th className="p-3.5 font-semibold">Year</th><th className="p-3.5 font-semibold">Test Status</th>
              <th className="p-3.5 font-semibold">Account Status</th><th className="p-3.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <SkeletonTableRows rows={6} cols={8} />}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8}>
                <EmptyState icon={<Icon.students size={22} />} title={hasFilters ? "No students match your filters" : "No students yet"} description={hasFilters ? "Try adjusting your search or filters." : "Add your first student to get started."} action={!hasFilters && <button onClick={openAdd} className="btn-primary"><Icon.plus size={16} /> Add Student</button>} />
              </td></tr>
            )}
            {rows.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50 transition">
                <td className="p-3.5 font-semibold text-ink-900">{s.fullName}</td>
                <td className="p-3.5 font-mono text-xs text-ink-600">{s.rollNumber}</td>
                <td className="p-3.5 font-mono text-xs text-ink-600">{s.username}</td>
                <td className="p-3.5 text-ink-600">{s.email}</td>
                <td className="p-3.5 text-ink-600">{s.year}</td>
                <td className="p-3.5"><Badge>{s.testStatus}</Badge></td>
                <td className="p-3.5"><Badge dot>{s.status}</Badge></td>
                <td className="p-3.5">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                    <button onClick={() => openEdit(s)} className="text-cyan-600 hover:underline">Edit</button>
                    <button onClick={() => toggleStatus(s)} className="text-warning-600 hover:underline">{s.status === "Active" ? "Disable" : "Enable"}</button>
                    <button onClick={() => handleResetPassword(s)} className="text-ink-400 hover:underline">Reset Password</button>
                    <button onClick={() => askDelete(s)} className="text-danger-600 hover:underline">Delete</button>
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

      <Modal open={modal === "add"} title="Add Student" subtitle="Create login credentials for a new student." onClose={closeModal}>
        <StudentForm onDone={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal open={modal === "edit"} title="Edit Student" onClose={closeModal}>
        <StudentForm student={activeStudent} onDone={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal open={modal === "import"} title="Import Students" subtitle="Bulk-create accounts from a CSV or Excel file." onClose={closeModal} wide>
        <StudentImport onDone={closeModal} />
      </Modal>

      <Modal open={!!resetResult} title="Password Reset" onClose={() => setResetResult(null)}>
        {resetResult && (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">New temporary password for <b>{resetResult.student.fullName}</b>:</p>
            <p className="font-mono text-lg bg-warning-50 border border-warning-500/20 rounded-xl px-3.5 py-2.5 text-warning-800">{resetResult.password}</p>
            <p className="text-xs text-ink-400">Shown once — share it with the student securely.</p>
            <button onClick={() => setResetResult(null)} className="btn-primary w-full">Done</button>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} confirmLabel="Delete" danger onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />
    </div>
  );
}
