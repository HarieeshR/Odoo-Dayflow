import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EmployeeProvider, useEmployee } from "./context/EmployeeContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import PortalLayout from "./layout/PortalLayout";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance";
import TimeOff from "./pages/TimeOff";
import Payroll from "./pages/Payroll";
import Documents from "./pages/Documents";
import Notifications from "./pages/Notifications";
import Policies from "./pages/Policies";
import Settings from "./pages/Settings";
import LoggedOut from "./pages/LoggedOut";

function PortalGate() {
  const { loggedOut } = useEmployee();

  if (loggedOut) {
    return <LoggedOut onBackToDemo={() => window.location.reload()} />;
  }

  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/time-off" element={<TimeOff />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <EmployeeProvider>
            <PortalGate />
          </EmployeeProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
