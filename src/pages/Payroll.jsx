import { useEffect, useState } from "react";
import { Download, ShieldCheck, IndianRupee } from "lucide-react";
import * as api from "../services/api";
import { useToast } from "../context/ToastContext";
import { StatusBadge, TableSkeleton, CardSkeleton, EmptyState, ErrorState } from "../components/ui";

function LineRow({ label, value, strong, negative }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-navy-900/[0.06] last:border-0">
      <span className={`text-sm ${strong ? "font-semibold text-navy-900" : "text-navy-600"}`}>{label}</span>
      <span className={`text-sm font-mono ${strong ? "font-bold text-navy-900" : negative ? "text-coral-500" : "text-navy-800"}`}>
        {negative ? "− " : ""}{value}
      </span>
    </div>
  );
}

export default function Payroll() {
  const toast = useToast();
  const [salary, setSalary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currency = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([api.getMyPayroll(), api.getMySalaryHistory()]);
      setSalary(s);
      setHistory(h);
    } catch (e) {
      setError(e.message || "Unable to load payroll.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownload = (row) => {
    toast.info(`Generating payslip for ${row.month}…`);
    setTimeout(() => toast.success(`Payslip for ${row.month} downloaded.`), 900);
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Current Salary */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-semibold text-navy-900">Current Salary</h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-500 bg-navy-900/[0.05] px-2.5 py-1 rounded-full">
              <ShieldCheck size={13} /> Read-only
            </span>
          </div>
          <p className="text-xs text-navy-400 mb-4">{salary ? `Paid ${salary.payFrequency.toLowerCase()}` : ""}</p>

          {loading || !salary ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : (
            <div>
              <LineRow label="Basic Salary" value={currency(salary.basic)} />
              <LineRow label="Allowances" value={currency(salary.allowances)} />
              <LineRow label="Deductions" value={currency(salary.deductions)} negative />
              <LineRow label="Gross Salary" value={currency(salary.gross)} strong />
              <div className="mt-3 rounded-xl bg-brand-900 text-white px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1.5"><IndianRupee size={14} /> Net Salary</span>
                <span className="font-display font-bold text-lg">{currency(salary.net)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Salary History */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="font-display font-semibold text-navy-900">Salary History</h3>
          </div>
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : history.length === 0 ? (
            <EmptyState title="No salary history available." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-navy-500 uppercase tracking-wide bg-navy-900/[0.02]">
                    <th className="px-6 py-3">Month</th>
                    <th className="px-6 py-3">Gross</th>
                    <th className="px-6 py-3">Deductions</th>
                    <th className="px-6 py-3">Net</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-900/[0.06]">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-navy-900/[0.015]">
                      <td className="px-6 py-3 font-medium text-navy-900">{row.month}</td>
                      <td className="px-6 py-3 text-navy-600 font-mono">{currency(row.gross)}</td>
                      <td className="px-6 py-3 text-navy-600 font-mono">{currency(row.deductions)}</td>
                      <td className="px-6 py-3 text-navy-900 font-mono font-semibold">{currency(row.net)}</td>
                      <td className="px-6 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleDownload(row)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-500"
                        >
                          <Download size={13} /> Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
