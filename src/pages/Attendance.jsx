import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CalendarCheck, CalendarX, CalendarClock, Clock3, TrendingUp } from "lucide-react";
import * as api from "../services/api";
import { StatusBadge, TableSkeleton, CardSkeleton, EmptyState, ErrorState } from "../components/ui";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All" },
];

function StatCard({ icon: Icon, label, value, accent }) {
  const accents = {
    sage: "bg-sage-100 text-sage-500",
    coral: "bg-coral-100 text-coral-500",
    sky: "bg-sky-100 text-sky-500",
    amber: "bg-amber-100 text-amber-600",
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accents[accent]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide">{label}</p>
        <p className="font-display text-xl font-bold text-navy-900">{value}</p>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [summary, setSummary] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, w, h] = await Promise.all([
        api.getAttendanceSummary(),
        api.getWeeklyAttendance(),
        api.getAttendanceHistory({ range: "month" }),
      ]);
      setSummary(s);
      setWeekly(w);
      setHistory(h);
    } catch (e) {
      setError(e.message || "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const applyRange = async (key) => {
    setRange(key);
    setTableLoading(true);
    try {
      let rows = await api.getAttendanceHistory({ range: key === "custom" ? "all" : key });
      if (key === "custom" && customFrom && customTo) {
        rows = rows.filter((r) => r.date >= customFrom && r.date <= customTo);
      }
      setHistory(rows);
    } catch (e) {
      setError(e.message);
    } finally {
      setTableLoading(false);
    }
  };

  const chartData = weekly.map((d) => ({ name: d.day, hours: d.workingHours || 0 }));

  if (error) return <ErrorState message={error} onRetry={loadAll} />;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading || !summary ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={CalendarCheck} label="Present Days" value={summary.present} accent="sage" />
            <StatCard icon={CalendarX} label="Absent Days" value={summary.absent} accent="coral" />
            <StatCard icon={CalendarClock} label="Leave Days" value={summary.leave} accent="sky" />
            <StatCard icon={Clock3} label="Total Hours" value={`${summary.totalHours}h`} accent="amber" />
            <StatCard icon={TrendingUp} label="Extra Hours" value={`${summary.extraHours}h`} accent="amber" />
          </>
        )}
      </div>

      {/* Weekly chart */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-navy-900 mb-1">This Week</h3>
        <p className="text-sm text-navy-500 mb-5">Working hours logged each day.</p>
        {loading ? (
          <TableSkeleton rows={1} cols={7} />
        ) : (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid vertical={false} stroke="#12172b" strokeOpacity={0.06} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#4a5488" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#4a5488" }} width={28} />
                  <Tooltip
                    cursor={{ fill: "rgba(18,23,43,0.04)" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(18,23,43,0.08)", fontSize: 13 }}
                    formatter={(v) => [`${v}h`, "Worked"]}
                  />
                  <Bar dataKey="hours" fill="#e8912a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-3 mt-5">
              {weekly.map((d) => (
                <div
                  key={d.date}
                  className={`rounded-xl border p-3 text-center ${d.isToday ? "border-amber-400 bg-amber-50" : "border-navy-900/[0.06]"}`}
                >
                  <p className="text-xs font-semibold text-navy-500">{d.day}</p>
                  <p className="text-[11px] text-navy-400 mb-1.5">{d.date.slice(5)}</p>
                  <StatusBadge status={d.status} />
                  {d.checkIn && <p className="text-[11px] text-navy-500 mt-1.5">{d.checkIn}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Attendance table */}
      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-navy-900/[0.06]">
          <h3 className="font-display font-semibold text-navy-900">Attendance History</h3>
          <div className="flex flex-wrap items-center gap-2">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => applyRange(r.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  range === r.key ? "bg-brand-900 text-white" : "bg-navy-900/[0.05] text-navy-600 hover:bg-navy-900/10"
                }`}
              >
                {r.label}
              </button>
            ))}
            <div className="flex items-center gap-1.5 pl-2 border-l border-navy-900/10 ml-1">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="text-xs border border-navy-900/15 rounded-lg px-2 py-1.5" />
              <span className="text-xs text-navy-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="text-xs border border-navy-900/15 rounded-lg px-2 py-1.5" />
              <button
                onClick={() => customFrom && customTo && applyRange("custom")}
                disabled={!customFrom || !customTo}
                className="text-xs font-semibold text-amber-600 hover:text-amber-500 disabled:opacity-40 disabled:cursor-not-allowed px-2"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {loading || tableLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : history.length === 0 ? (
          <EmptyState title="No attendance records found." description="Try a different date range." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-navy-500 uppercase tracking-wide bg-navy-900/[0.02]">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Check In</th>
                  <th className="px-5 py-3">Check Out</th>
                  <th className="px-5 py-3">Working Hours</th>
                  <th className="px-5 py-3">Extra Hours</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/[0.06]">
                {history.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-900/[0.015]">
                    <td className="px-5 py-3 font-medium text-navy-900">{r.date}</td>
                    <td className="px-5 py-3 text-navy-600">{r.checkIn || "—"}</td>
                    <td className="px-5 py-3 text-navy-600">{r.checkOut || "—"}</td>
                    <td className="px-5 py-3 text-navy-600">{r.workingHours ? `${r.workingHours}h` : "—"}</td>
                    <td className="px-5 py-3 text-navy-600">{r.extraHours ? `${r.extraHours}h` : "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
