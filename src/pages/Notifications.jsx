import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { CalendarClock, Fingerprint, FileText, Megaphone, Bell, CheckCheck, ShieldCheck } from "lucide-react";
import * as api from "../services/api";
import { TableSkeleton, EmptyState, ErrorState, SecondaryButton } from "../components/ui";

const ICONS = {
  leave: CalendarClock,
  attendance: Fingerprint,
  document: FileText,
  announcement: Megaphone,
  security: ShieldCheck,
};
const ACCENTS = {
  leave: "bg-sky-100 text-sky-500",
  attendance: "bg-amber-100 text-amber-600",
  document: "bg-sage-100 text-sage-500",
  announcement: "bg-coral-100 text-coral-500",
  security: "bg-navy-900/10 text-navy-700",
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const { refreshUnread } = useOutletContext() || {};

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getNotifications();
      setItems(list);
    } catch (e) {
      setError(e.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpen = async (n) => {
    if (!n.read) {
      await api.markNotificationRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      refreshUnread?.();
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    await api.markAllNotificationsRead();
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    refreshUnread?.();
  };

  const unreadCount = items.filter((n) => !n.read).length;
  const visible = filter === "unread" ? items.filter((n) => !n.read) : items;

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${filter === "all" ? "bg-brand-900 text-white" : "bg-navy-900/[0.05] text-navy-600"}`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${filter === "unread" ? "bg-brand-900 text-white" : "bg-navy-900/[0.05] text-navy-600"}`}
          >
            Unread ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 && (
          <SecondaryButton onClick={markAll}><CheckCheck size={14} /> Mark all as read</SecondaryButton>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={1} />
        ) : visible.length === 0 ? (
          <EmptyState icon={Bell} title={filter === "unread" ? "You're all caught up." : "No notifications yet."} />
        ) : (
          <div className="divide-y divide-navy-900/[0.06]">
            {visible.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={`w-full flex items-start gap-4 px-5 py-4 text-left transition hover:bg-navy-900/[0.02] ${!n.read ? "bg-amber-50/40" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ACCENTS[n.type] || "bg-navy-900/[0.05] text-navy-500"}`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-navy-900">{n.title}</p>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                    </div>
                    <p className="text-sm text-navy-500 mt-0.5">{n.body}</p>
                    <p className="text-xs text-navy-400 mt-1">{timeAgo(n.timestamp)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
