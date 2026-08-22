import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useEmployee } from "../context/EmployeeContext";
import * as api from "../services/api";
import { Modal, SecondaryButton } from "../components/ui";
import { LogOut } from "lucide-react";

const TITLES = {
  "/": "Dashboard",
  "/profile": "My Profile",
  "/attendance": "Attendance",
  "/time-off": "Time Off",
  "/payroll": "Payroll",
  "/documents": "Documents",
  "/notifications": "Notifications",
  "/policies": "Company Policies",
  "/settings": "Settings",
};

export default function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const location = useLocation();
  const { logout } = useEmployee();

  const refreshUnread = async () => {
    const list = await api.getNotifications();
    setUnreadCount(list.filter((n) => !n.read).length);
  };

  useEffect(() => {
    refreshUnread();
  }, [location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const title = TITLES[location.pathname] || "Dayflow";

  return (
    <div className="min-h-screen flex bg-mist-100">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadCount={unreadCount}
        onLogoutClick={() => setLogoutOpen(true)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          unreadCount={unreadCount}
          onLogoutClick={() => setLogoutOpen(true)}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-[1400px] w-full mx-auto">
          <Outlet context={{ refreshUnread }} />
        </main>
      </div>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Log out of Dayflow?"
        footer={
          <>
            <SecondaryButton onClick={() => setLogoutOpen(false)}>Cancel</SecondaryButton>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl bg-coral-500 text-white font-semibold text-sm px-4 py-2.5 hover:opacity-90"
            >
              <LogOut size={15} /> Log out
            </button>
          </>
        }
      >
        <p className="text-sm text-navy-600">
          You'll be signed out of your Employee Portal session and returned to the sign-in screen.
        </p>
      </Modal>
    </div>
  );
}
