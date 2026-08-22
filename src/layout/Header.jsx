import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, ChevronDown, UserRound, Settings, LogOut } from "lucide-react";
import { useEmployee } from "../context/EmployeeContext";

export default function Header({ title, onMenuClick, unreadCount, onLogoutClick }) {
  const { employee } = useEmployee();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = employee
    ? `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`
    : "";

  return (
    <header className="sticky top-0 z-30 h-20 bg-mist-100/80 backdrop-blur-md border-b border-navy-900/[0.06] flex items-center justify-between px-4 sm:px-6 lg:px-10">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-navy-900">
          <Menu size={22} />
        </button>
        <h1 className="font-display font-semibold text-xl sm:text-2xl text-navy-900 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2.5 rounded-full hover:bg-navy-900/[0.05] text-navy-700 transition"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral-500 ring-2 ring-mist-100" />
          )}
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-full hover:bg-navy-900/[0.05] transition"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-display font-semibold text-sm shrink-0"
              style={{ backgroundColor: employee?.avatarColor || "#4a5488" }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-semibold text-navy-900">{employee ? `${employee.firstName} ${employee.lastName}` : ""}</p>
              <p className="text-xs text-navy-500">{employee?.position}</p>
            </div>
            <ChevronDown size={15} className="text-navy-500 hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-surface rounded-xl shadow-xl border border-navy-900/[0.06] py-1.5 animate-[fadeIn_.12s_ease-out]">
              <button
                onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-800 hover:bg-navy-900/[0.04]"
              >
                <UserRound size={16} /> My Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-800 hover:bg-navy-900/[0.04]"
              >
                <Settings size={16} /> Settings
              </button>
              <div className="h-px bg-navy-900/[0.06] my-1.5" />
              <button
                onClick={() => { setMenuOpen(false); onLogoutClick(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-coral-500 hover:bg-coral-100"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
