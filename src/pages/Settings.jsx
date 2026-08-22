import { useEffect, useState } from "react";
import { KeyRound, Bell, Sun, Moon, Mail, Hash } from "lucide-react";
import * as api from "../services/api";
import { useEmployee } from "../context/EmployeeContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import { PrimaryButton, SkeletonBlock, ErrorState } from "../components/ui";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${checked ? "bg-amber-500" : "bg-navy-900/15"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function Settings() {
  const { employee } = useEmployee();
  const toast = useToast();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch (e) {
      setError(e.message || "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleNotif = async (key, value) => {
    const prev = settings;
    const next = { ...settings, notifications: { ...settings.notifications, [key]: value } };
    setSettings(next);
    try {
      await api.updateSettings({ notifications: next.notifications });
      toast.success("Notification preferences updated.");
    } catch (e) {
      setSettings(prev);
      toast.error(e.message);
    }
  };

  const { theme, setTheme } = useTheme();

  const setAppearance = async (mode) => {
    if (mode === theme) return;
    await setTheme(mode);
    setSettings((s) => (s ? { ...s, appearance: mode } : s));
    toast.success(`Switched to ${mode} mode.`);
  };

  const submitPassword = async () => {
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = "Required.";
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) errs.newPassword = "At least 8 characters.";
    if (pwForm.confirm !== pwForm.newPassword) errs.confirm = "Passwords do not match.";
    setPwErrors(errs);
    if (Object.keys(errs).length) return;

    setPwSaving(true);
    try {
      await api.changePassword(pwForm);
      toast.success("Password changed successfully. HR has been notified for your account's security records.");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPwSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Account */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-navy-900 mb-4">Account</h3>
        {!employee ? (
          <SkeletonBlock className="h-10 w-full" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-navy-900/[0.03] rounded-xl px-4 py-3">
              <Mail size={16} className="text-navy-500" />
              <div>
                <p className="text-xs text-navy-500">Email</p>
                <p className="text-sm font-medium text-navy-900">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-navy-900/[0.03] rounded-xl px-4 py-3">
              <Hash size={16} className="text-navy-500" />
              <div>
                <p className="text-xs text-navy-500">Employee ID</p>
                <p className="text-sm font-medium text-navy-900 font-mono">{employee.employeeId}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={17} className="text-navy-500" />
          <h3 className="font-display font-semibold text-navy-900">Security</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Current Password</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 ${pwErrors.currentPassword ? "border-coral-500" : "border-navy-900/15"}`}
            />
            {pwErrors.currentPassword && <p className="text-xs text-coral-500 mt-1">{pwErrors.currentPassword}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide">New Password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 ${pwErrors.newPassword ? "border-coral-500" : "border-navy-900/15"}`}
            />
            {pwErrors.newPassword && <p className="text-xs text-coral-500 mt-1">{pwErrors.newPassword}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Confirm Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 ${pwErrors.confirm ? "border-coral-500" : "border-navy-900/15"}`}
            />
            {pwErrors.confirm && <p className="text-xs text-coral-500 mt-1">{pwErrors.confirm}</p>}
          </div>
        </div>
        <PrimaryButton onClick={submitPassword} loading={pwSaving} className="mt-4">
          Change Password
        </PrimaryButton>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={17} className="text-navy-500" />
          <h3 className="font-display font-semibold text-navy-900">Notifications</h3>
        </div>
        {loading || !settings ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-10" />)}</div>
        ) : (
          <div className="divide-y divide-navy-900/[0.06]">
            {[
              { key: "leave", label: "Leave notifications", desc: "Updates when your leave requests are approved or rejected." },
              { key: "attendance", label: "Attendance reminders", desc: "Reminders to check in if you haven't yet." },
              { key: "hr", label: "HR notifications", desc: "Company announcements and HR updates." },
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{row.label}</p>
                  <p className="text-xs text-navy-500">{row.desc}</p>
                </div>
                <Toggle checked={settings.notifications[row.key]} onChange={(v) => toggleNotif(row.key, v)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-navy-900 mb-4">Appearance</h3>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <button
            onClick={() => setAppearance("light")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              theme === "light" ? "border-amber-400 bg-amber-50 text-amber-600" : "border-navy-900/10 text-navy-600"
            }`}
          >
            <Sun size={16} /> Light
          </button>
          <button
            onClick={() => setAppearance("dark")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              theme === "dark" ? "border-amber-400 bg-amber-50 text-amber-600" : "border-navy-900/10 text-navy-600"
            }`}
          >
            <Moon size={16} /> Dark
          </button>
        </div>
      </div>
    </div>
  );
}
