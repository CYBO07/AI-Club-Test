import React, { useState } from "react";
import { api } from "../../api/client.js";
import { TextInput, SelectInput } from "../../components/FormField.jsx";
import { Icon } from "../../components/Icons.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const YEARS = ["BCA 1st Year", "BCA 2nd Year", "BCA 3rd Year"];

export default function StudentForm({ student, onDone, onCancel }) {
  const isEdit = !!student;
  const toast = useToast();
  const [form, setForm] = useState({
    fullName: student?.fullName || "",
    rollNumber: student?.rollNumber || "",
    email: student?.email || "",
    username: student?.username || "",
    password: "",
    year: student?.year || "",
    phone: student?.phone || "",
    status: student?.status || "Active",
    loginMethod: student?.loginMethod || "both",
    generatePassword: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isEdit) {
        await api.put(`/students/${student._id}`, form);
        toast.success("Student updated successfully");
        onDone();
      } else {
        const result = await api.post("/students", form);
        setCreated(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function copyPassword() {
    navigator.clipboard?.writeText(created.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (created) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-success-50 border border-success-500/20 p-5">
          <p className="flex items-center gap-2 font-bold text-success-700"><Icon.check size={16} /> Student Created Successfully</p>
          <dl className="mt-3 text-sm space-y-1.5">
            <Row label="Name" value={created.fullName} />
            <Row label="Roll Number" value={created.rollNumber} />
            <Row label="Username" value={created.username} />
            <Row label="Email" value={created.email} />
            <Row label="Year" value={created.year} />
            <Row label="Status" value={created.status} />
          </dl>
        </div>
        {created.temporaryPassword && (
          <div className="rounded-2xl bg-warning-50 border border-warning-500/20 p-5">
            <p className="text-sm font-bold text-warning-700">Temporary password (shown once only)</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="font-mono text-lg text-warning-800 bg-white rounded-lg px-3 py-2 border border-warning-500/20 flex-1">{created.temporaryPassword}</p>
              <button onClick={copyPassword} className="btn-outline px-3 py-2.5"><Icon.copy size={15} /> {copied ? "Copied" : "Copy"}</button>
            </div>
            <p className="mt-2 text-xs text-warning-700">Share this with the student securely. It will not be shown again.</p>
          </div>
        )}
        <button onClick={() => { toast.success("Student created successfully"); onDone(); }} className="btn-primary w-full py-3">Done</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Full Name" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        <TextInput label="Roll Number" required value={form.rollNumber} onChange={(e) => set("rollNumber", e.target.value)} />
        <TextInput label="Email" required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        <TextInput label="Username" required value={form.username} onChange={(e) => set("username", e.target.value)} />
        <SelectInput label="BCA Year" required options={YEARS} value={form.year} onChange={(e) => set("year", e.target.value)} />
        <TextInput label="Phone Number" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <SelectInput label="Account Status" required options={["Active", "Disabled"]} value={form.status} onChange={(e) => set("status", e.target.value)} />
        <SelectInput label="Login Method" required options={["both", "username", "email"]} value={form.loginMethod} onChange={(e) => set("loginMethod", e.target.value)} />
      </div>

      {!isEdit && (
        <div className="border-t border-line pt-4 space-y-3">
          <TextInput
            label="Password"
            type="text"
            disabled={form.generatePassword}
            value={form.generatePassword ? "" : form.password}
            placeholder={form.generatePassword ? "Will be generated automatically" : "Minimum 8 characters"}
            onChange={(e) => set("password", e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-ink-600 font-medium">
            <input type="checkbox" checked={form.generatePassword} onChange={(e) => set("generatePassword", e.target.checked)} className="rounded" />
            Generate Password automatically
          </label>
        </div>
      )}

      {error && <p className="text-sm text-danger-600 bg-danger-50 border border-danger-500/20 rounded-xl px-3.5 py-2.5">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving..." : isEdit ? "Save Changes" : "Create Student"}</button>
      </div>
    </form>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-success-700/80">{label}</span>
      <span className="font-semibold text-success-800">{value}</span>
    </div>
  );
}
