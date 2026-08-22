import { useEffect, useMemo, useState } from "react";
import { Plus, X, Umbrella, Stethoscope, Ban } from "lucide-react";
import * as api from "../services/api";
import { useToast } from "../context/ToastContext";
import {
  StatusBadge, TableSkeleton, CardSkeleton, EmptyState, ErrorState,
  Modal, PrimaryButton, SecondaryButton, AmberButton,
} from "../components/ui";

const LEAVE_TYPES = [
  { key: "Paid", icon: Umbrella, accent: "sage" },
  { key: "Sick", icon: Stethoscope, accent: "sky" },
  { key: "Unpaid", icon: Ban, accent: "coral" },
];

function BalanceCard({ type, icon: Icon, value, accent }) {
  const accents = {
    sage: "bg-sage-100 text-sage-500",
    sky: "bg-sky-100 text-sky-500",
    coral: "bg-coral-100 text-coral-500",
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accents[accent]}`}>
        <Icon size={19} />
      </div>
      <div>
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide">{type} Leave</p>
        <p className="font-display text-2xl font-bold text-navy-900">{value} <span className="text-sm font-medium text-navy-400">days left</span></p>
      </div>
    </div>
  );
}

export default function TimeOff() {
  const toast = useToast();
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [applyOpen, setApplyOpen] = useState(false);
  const [form, setForm] = useState({ type: "Paid", startDate: "", endDate: "", remarks: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, r] = await Promise.all([api.getLeaveBalance(), api.getMyLeaveRequests()]);
      setBalance(b);
      setRequests(r);
    } catch (e) {
      setError(e.message || "Unable to load leave data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const days = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const d = Math.round((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1;
    return d > 0 ? d : 0;
  }, [form.startDate, form.endDate]);

  const openApply = () => {
    setForm({ type: "Paid", startDate: "", endDate: "", remarks: "" });
    setFormErrors({});
    setApplyOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.startDate) errs.startDate = "Start date is required.";
    if (!form.endDate) errs.endDate = "End date is required.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = "End date cannot be before start date.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.applyForLeave(form);
      toast.success("Leave request submitted.");
      setApplyOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await api.cancelLeaveRequest(cancelTarget.id);
      toast.success("Leave request cancelled.");
      setCancelTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-500">Track your balance, apply for leave, and follow request status.</p>
        <AmberButton onClick={openApply}><Plus size={15} /> Apply for Leave</AmberButton>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {loading || !balance ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          LEAVE_TYPES.map((t) => (
            <BalanceCard key={t.key} type={t.key} icon={t.icon} accent={t.accent} value={balance[t.key.toLowerCase()]} />
          ))
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-navy-900/[0.06]">
          <h3 className="font-display font-semibold text-navy-900">Leave History</h3>
        </div>
        {loading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : requests.length === 0 ? (
          <EmptyState title="No leave requests yet." description="Apply for your first leave using the button above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-navy-500 uppercase tracking-wide bg-navy-900/[0.02]">
                  <th className="px-5 py-3">Request ID</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Days</th>
                  <th className="px-5 py-3">Remarks</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/[0.06]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-900/[0.015] align-top">
                    <td className="px-5 py-3 font-mono text-xs text-navy-700">{r.id}</td>
                    <td className="px-5 py-3 font-medium text-navy-900">{r.type}</td>
                    <td className="px-5 py-3 text-navy-600 whitespace-nowrap">{r.startDate} → {r.endDate}</td>
                    <td className="px-5 py-3 text-navy-600">{r.days}</td>
                    <td className="px-5 py-3 text-navy-600 max-w-[220px]">
                      <p className="truncate">{r.remarks || "—"}</p>
                      {r.status === "Rejected" && r.comment && (
                        <p className="text-xs text-coral-500 mt-1">HR: {r.comment}</p>
                      )}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3">
                      {r.status === "Pending" && (
                        <button
                          onClick={() => setCancelTarget(r)}
                          className="text-xs font-semibold text-coral-500 hover:text-coral-600"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="Apply for Leave"
        footer={
          <>
            <SecondaryButton onClick={() => setApplyOpen(false)}>Cancel</SecondaryButton>
            <AmberButton onClick={submit} loading={submitting}>Submit Request</AmberButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Leave Type</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {LEAVE_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setForm((f) => ({ ...f, type: t.key }))}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    form.type === t.key ? "border-amber-400 bg-amber-50 text-amber-600" : "border-navy-900/10 text-navy-600 hover:bg-navy-900/[0.03]"
                  }`}
                >
                  {t.key}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 ${formErrors.startDate ? "border-coral-500" : "border-navy-900/15"}`}
              />
              {formErrors.startDate && <p className="text-xs text-coral-500 mt-1">{formErrors.startDate}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 ${formErrors.endDate ? "border-coral-500" : "border-navy-900/15"}`}
              />
              {formErrors.endDate && <p className="text-xs text-coral-500 mt-1">{formErrors.endDate}</p>}
            </div>
          </div>

          {days > 0 && (
            <p className="text-sm text-navy-600 bg-navy-900/[0.03] rounded-lg px-3 py-2">
              This request covers <span className="font-semibold">{days} day{days > 1 ? "s" : ""}</span>.
            </p>
          )}

          <div>
            <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              rows={3}
              placeholder="Reason for leave (optional)"
              className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Cancel confirm */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Leave Request?"
        footer={
          <>
            <SecondaryButton onClick={() => setCancelTarget(null)}>Keep Request</SecondaryButton>
            <button
              onClick={confirmCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-2 rounded-xl bg-coral-500 text-white font-semibold text-sm px-4 py-2.5 hover:opacity-90 disabled:opacity-50"
            >
              <X size={14} /> {cancelling ? "Cancelling…" : "Cancel Request"}
            </button>
          </>
        }
      >
        <p className="text-sm text-navy-600">
          This will cancel your pending {cancelTarget?.type} leave request ({cancelTarget?.id}) for {cancelTarget?.startDate} → {cancelTarget?.endDate}.
        </p>
      </Modal>
    </div>
  );
}
