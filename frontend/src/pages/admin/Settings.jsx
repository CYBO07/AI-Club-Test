import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { api } from "../../api/client.js";
import { Icon } from "../../components/Icons.jsx";

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const initials = (user?.fullName || "A").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Settings</h1>
        <p className="text-ink-400 mt-1 text-sm">Manage your administrator account.</p>
      </div>

      <div className="card p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-navy-950 text-cyan-400 flex items-center justify-center text-xl font-extrabold shrink-0">{initials}</div>
        <div>
          <p className="font-bold text-lg text-ink-900">{user?.fullName}</p>
          <p className="text-sm text-ink-400">{user?.email}</p>
          <p className="text-xs text-ink-400 font-mono mt-0.5">@{user?.username}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-ink-900 mb-4">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <label className="block text-sm"><span className="label">Current password</span><input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input" /></label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm"><span className="label">New password</span><input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" /></label>
            <label className="block text-sm"><span className="label">Confirm new password</span><input required type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" /></label>
          </div>
          {error && <p className="text-sm text-danger-600 bg-danger-50 border border-danger-500/20 rounded-xl px-3.5 py-2.5">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Updating..." : "Update Password"}</button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-bold text-ink-900 mb-2 flex items-center gap-2"><Icon.alert size={16} className="text-warning-600" /> About this platform</h2>
        <p className="text-sm text-ink-600">Students, questions, and tests are entirely admin-controlled. There is no self-registration and no seeded demo data — everything visible to students comes from what you configure here.</p>
      </div>
    </div>
  );
}
