import { NavLink } from "react-router-dom";
import {
  LayoutGrid, UserRound, Fingerprint, CalendarClock, Wallet,
  FolderOpen, Bell, ScrollText, Settings, LogOut, Sunrise, X,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/profile", label: "My Profile", icon: UserRound },
  { to: "/attendance", label: "Attendance", icon: Fingerprint },
  { to: "/time-off", label: "Time Off", icon: CalendarClock },
  { to: "/payroll", label: "Payroll", icon: Wallet },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/notifications", label: "Notifications", icon: Bell, badgeKey: "unread" },
  { to: "/policies", label: "Policies", icon: ScrollText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose, unreadCount, onLogoutClick }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-navy-950/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 bg-navy-950 text-white/90 flex flex-col z-50 transition-transform duration-200 shrink-0
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 h-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
              <Sunrise size={18} className="text-navy-950" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">Dayflow</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-mist-300">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end, badgeKey }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-mist-300/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={isActive ? 2.4 : 2} className={isActive ? "text-amber-400" : ""} />
                  <span className="flex-1">{label}</span>
                  {badgeKey === "unread" && unreadCount > 0 && (
                    <span className="text-[11px] font-bold bg-amber-400 text-navy-950 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.06]">
          <button
            onClick={onLogoutClick}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-mist-300/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
