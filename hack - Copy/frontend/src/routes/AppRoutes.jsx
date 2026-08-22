import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import EmployeeLayout from '../layouts/EmployeeLayout';

// Auth Pages
import LoginPage from '../features/auth/LoginPage';
import SignupPage from '../features/auth/SignupPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';
import ChangePasswordPage from '../features/auth/ChangePasswordPage';

// Admin Pages
import AdminDashboard from '../features/dashboard/AdminDashboard';
import EmployeeListPage from '../features/employees/EmployeeListPage';
import CreateEmployeePage from '../features/employees/CreateEmployeePage';
import EmployeeDetailPage from '../features/employees/EmployeeDetailPage';
import EditEmployeePage from '../features/employees/EditEmployeePage';
import AdminAttendancePage from '../features/attendance/AdminAttendancePage';
import LeaveApprovalPage from '../features/leave/LeaveApprovalPage';
import LeaveBalancePage from '../features/leave/LeaveBalancePage';
import AdminPayrollPage from '../features/payroll/AdminPayrollPage';
import SalaryEditPage from '../features/payroll/SalaryEditPage';
import ReportsPage from '../features/reports/ReportsPage';
import AuditLogPage from '../features/reports/AuditLogPage';

// Employee Pages
import EmployeeDashboard from '../features/dashboard/EmployeeDashboard';
import ProfilePage from '../features/profile/ProfilePage';
import AttendancePage from '../features/attendance/AttendancePage';
import LeaveRequestPage from '../features/leave/LeaveRequestPage';
import SalaryViewPage from '../features/payroll/SalaryViewPage';

// Shared Pages
import DocumentsPage from '../features/documents/DocumentsPage';
import NotificationsPage from '../features/notifications/NotificationsPage';
import AIChatPage from '../features/ai/AIChatPage';
import NotFoundPage from '../features/NotFoundPage';

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      <Route element={<ProtectedRoute />}>
        {/* Admin Routes */}
        <Route path="/admin" element={<RoleRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<EmployeeListPage />} />
            <Route path="employees/create" element={<CreateEmployeePage />} />
            <Route path="employees/:id" element={<EmployeeDetailPage />} />
            <Route path="employees/:id/edit" element={<EditEmployeePage />} />
            <Route path="attendance" element={<AdminAttendancePage />} />
            <Route path="leave" element={<LeaveApprovalPage />} />
            <Route path="leave/balances" element={<LeaveBalancePage />} />
            <Route path="payroll" element={<AdminPayrollPage />} />
            <Route path="payroll/:employeeId/edit" element={<SalaryEditPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="ai" element={<AIChatPage />} />
          </Route>
        </Route>

        {/* Employee Routes */}
        <Route path="/employee" element={<RoleRoute allowedRoles={['employee']} />}>
          <Route element={<EmployeeLayout />}>
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="leave" element={<LeaveRequestPage />} />
            <Route path="salary" element={<SalaryViewPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="ai" element={<AIChatPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
