import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Clock, LogIn, LogOut, TrendingUp, CalendarClock, Wallet, FolderOpen, ArrowRight, Fingerprint,
} from "lucide-react";
import { useEmployee } from "../context/EmployeeContext";
import * as api from "../services/api";
import { useToast } from "../context/ToastContext";
import { CardSkeleton, ErrorState, SkeletonBlock, AmberButton, StatusBadge } from "../components/ui";

function StatCard({ icon: Icon, label, value, sub, accent = "amber" }) {
  const accents = {
    amber: "bg-amber-100 text-amber-600",
    sage: "bg-sage-100 text-sage-500",
    sky: "bg-sky-100 text-sky-500",
    coral: "bg-coral-100 text-coral-500",
  };
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide">{label}</p>
        <p className="font-display text-2xl font-bold text-navy-900 mt-1.5">{value}</p>
        {sub && <p className="text-xs text-navy-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accents[accent]}`}>
        <Icon size={18} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { employee } = useEmployee();
  const { refreshUnread } = useOutletContext() || {};
  const toast = useToast();

  const [today, setToday] = useState(null);
  const [summary, setSummary] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [clock, setClock] = useState(new Date());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, s, lb, leaves, notifs] = await Promise.all([
        api.getTodayAttendance(),
        api.getAttendanceSummary(),
        api.getLeaveBalance(),
        api.getMyLeaveRequests(),
        api.getNotifications(),
      ]);
      setToday(t);
      setSummary(s);
      setLeaveBalance(lb);
      setRecentLeaves(leaves.slice(0, 3));
      setNotifications(notifs.slice(0, 4));
    } catch (e) {
      setError(e.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => setClock(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const t = await api.checkIn();
      setToday(t);
      toast.success(`Checked in at ${t.checkIn}. Have a great day!`);
      refreshUnread?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const t = await api.checkOut();
      setToday(t);
      toast.success(`Checked out at ${t.checkOut}. See you tomorrow!`);
      const s = await api.getAttendanceSummary();
      setSummary(s);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const workingDuration = () => {
    if (!today?.checkIn) return "00h 00m";
    const parse = (s) => {
      const [time, period] = s.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };
    const startMin = parse(today.checkIn);
    const endMin = today.checkOut ? parse(today.checkOut) : clock.getHours() * 60 + clock.getMinutes();
    const diff = Math.max(0, endMin - startMin);
    return `${String(Math.floor(diff / 60)).padStart(2, "0")}h ${String(diff % 60).padStart(2, "0")}m`;
  };

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Greeting + Check-in card */}
      <div className="card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-amber-50" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-navy-500 font-medium">
              {clock.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
              {loading ? <SkeletonBlock className="h-8 w-56" /> : `Welcome back, ${employee?.firstName}`}
            </h2>
            <p className="text-navy-500 mt-2 max-w-md">
              {loading
                ? ""
                : today?.checkOut
                ? "You've completed attendance for today."
                : today?.checkIn
                ? "You're checked in — have a productive day."
                : "You haven't checked in yet today."}
            </p>
          </div>

          <div className="flex items-center gap-5 sm:gap-8">
            <div className="text-center">
              <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1">Check In</p>
              {loading ? <SkeletonBlock className="h-6 w-20 mx-auto" /> : <p className="font-display font-bold text-navy-900">{today?.checkIn || "—"}</p>}
            </div>
            <div className="w-px h-10 bg-navy-900/10" />
            <div className="text-center">
              <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1">Check Out</p>
              {loading ? <SkeletonBlock className="h-6 w-24 mx-auto" /> : <p className="font-display font-bold text-navy-900">{today?.checkOut || "Not checked out"}</p>}
            </div>
            <div className="w-px h-10 bg-navy-900/10" />
            <div className="text-center">
              <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1">Working</p>
              {loading ? <SkeletonBlock className="h-6 w-16 mx-auto" /> : <p className="font-display font-bold text-navy-900">{workingDuration()}</p>}
            </div>
          </div>

          <div className="shrink-0">
            {!loading && !today?.checkIn && (
              <AmberButton onClick={handleCheckIn} loading={actionLoading} className="px-6 py-3 text-base">
                <LogIn size={17} /> Check In
              </AmberButton>
            )}
            {!loading && today?.checkIn && !today?.checkOut && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 text-white font-semibold text-base px-6 py-3 transition hover:bg-brand-800 disabled:opacity-50"
              >
                <LogOut size={17} /> Check Out
              </button>
            )}
            {!loading && today?.checkOut && (
              <div className="flex items-center gap-2 text-sage-500 font-semibold bg-sage-100 rounded-xl px-4 py-3">
                <Fingerprint size={17} /> Attendance completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !summary ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Clock} label="Present Days" value={summary.present} sub="Last 30 days" accent="sage" />
            <StatCard icon={TrendingUp} label="Total Hours" value={`${summary.totalHours}h`} sub="Last 30 days" accent="amber" />
            <StatCard icon={CalendarClock} label="Paid Leave Left" value={leaveBalance?.paid ?? "—"} sub="days available" accent="sky" />
            <StatCard icon={Fingerprint} label="Extra Hours" value={`${summary.extraHours}h`} sub="Last 30 days" accent="coral" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent leave requests */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-navy-900">Recent Leave Requests</h3>
            <Link to="/time-off" className="text-sm font-semibold text-amber-600 hover:text-amber-500 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-12" />)}</div>
          ) : recentLeaves.length === 0 ? (
            <p className="text-sm text-navy-500 py-6 text-center">No leave requests yet.</p>
          ) : (
            <div className="divide-y divide-navy-900/[0.06]">
              {recentLeaves.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{l.type} Leave · {l.days} day{l.days > 1 ? "s" : ""}</p>
                    <p className="text-xs text-navy-500">{l.startDate} → {l.endDate}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications preview */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-navy-900">Recent Activity</h3>
            <Link to="/notifications" className="text-sm font-semibold text-amber-600 hover:text-amber-500 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-10" />)}</div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-navy-500 py-6 text-center">You're all caught up.</p>
          ) : (
            <div className="space-y-4">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${n.read ? "bg-navy-900/15" : "bg-amber-500"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{n.title}</p>
                    <p className="text-xs text-navy-500 line-clamp-1">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/payroll" className="card p-5 flex items-center gap-4 hover:border-amber-400/40 transition group">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><Wallet size={18} /></div>
          <div>
            <p className="font-semibold text-navy-900 text-sm">My Payroll</p>
            <p className="text-xs text-navy-500">View salary details</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-navy-300 group-hover:text-amber-500 transition" />
        </Link>
        <Link to="/documents" className="card p-5 flex items-center gap-4 hover:border-amber-400/40 transition group">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center"><FolderOpen size={18} /></div>
          <div>
            <p className="font-semibold text-navy-900 text-sm">My Documents</p>
            <p className="text-xs text-navy-500">View & request docs</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-navy-300 group-hover:text-amber-500 transition" />
        </Link>
        <Link to="/time-off" className="card p-5 flex items-center gap-4 hover:border-amber-400/40 transition group">
          <div className="w-10 h-10 rounded-xl bg-sage-100 text-sage-500 flex items-center justify-center"><CalendarClock size={18} /></div>
          <div>
            <p className="font-semibold text-navy-900 text-sm">Apply for Leave</p>
            <p className="text-xs text-navy-500">Submit a new request</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-navy-300 group-hover:text-amber-500 transition" />
        </Link>
      </div>
    </div>
  );
}
