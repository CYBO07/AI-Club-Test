import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../api/client.js";
import { Icon } from "../../components/Icons.jsx";

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const initials = (user?.fullName || "S").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  async function handleChangePassword(e) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) return setError("New passwords do not match");
    setBusy(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password updated successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Profile</h1>
        <p className="text-ink-400 mt-1">Your account details, assigned by the administrator.</p>
      </div>

      <div className="card p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-navy-950 text-cyan-400 flex items-center justify-center text-xl font-extrabold shrink-0">{initials}</div>
        <div>
          <p className="font-bold text-lg text-ink-900">{user?.fullName}</p>
          <p className="text-sm text-ink-400">{user?.email}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-ink-900 mb-4">Account details</h2>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <Field label="Roll Number" value={user?.rollNumber} />
          <Field label="Username" value={user?.username} />
          <Field label="Academic Year" value={user?.year} />
          <Field label="Email" value={user?.email} />
        </dl>
        <p className="mt-4 text-xs text-ink-400 flex items-start gap-1.5">
          <Icon.alert size={14} className="mt-0.5 shrink-0" />
          Your academic year is assigned by the administrator and cannot be changed from this page.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-ink-900 mb-4">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <label className="block text-sm">
            <span className="label">Current password</span>
            <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input" />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="label">New password</span>
              <input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" />
            </label>
            <label className="block text-sm">
              <span className="label">Confirm new password</span>
              <input required type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" />
            </label>
          </div>
          {error && <p className="text-sm text-danger-600 bg-danger-50 border border-danger-500/20 rounded-xl px-3.5 py-2.5">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Updating..." : "Update Password"}</button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3">
      <dt className="text-xs text-ink-400 font-medium">{label}</dt>
      <dd className="font-semibold text-ink-900 mt-0.5">{value || "—"}</dd>
    </div>
  );
}
