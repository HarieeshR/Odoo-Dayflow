import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineHome, 
  HiOutlineUsers, 
  HiOutlineClock, 
  HiOutlineCalendar, 
  HiOutlineCurrencyRupee, 
  HiOutlineDocumentText, 
  HiOutlineChartBar, 
  HiOutlineSparkles, 
  HiOutlineClipboardList,
  HiOutlineLogout
} from 'react-icons/hi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: HiOutlineHome },
    { name: 'Employees', path: '/admin/employees', icon: HiOutlineUsers },
    { name: 'Attendance', path: '/admin/attendance', icon: HiOutlineClock },
    { name: 'Leave Management', path: '/admin/leave', icon: HiOutlineCalendar },
    { name: 'Payroll', path: '/admin/payroll', icon: HiOutlineCurrencyRupee },
    { name: 'Documents', path: '/admin/documents', icon: HiOutlineDocumentText },
    { name: 'Reports', path: '/admin/reports', icon: HiOutlineChartBar },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: HiOutlineClipboardList },
    { name: 'AI Assistant', path: '/admin/ai', icon: HiOutlineSparkles },
  ];

  const employeeLinks = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: HiOutlineHome },
    { name: 'My Profile', path: '/employee/profile', icon: HiOutlineUsers },
    { name: 'Attendance', path: '/employee/attendance', icon: HiOutlineClock },
    { name: 'Leave', path: '/employee/leave', icon: HiOutlineCalendar },
    { name: 'Salary', path: '/employee/salary', icon: HiOutlineCurrencyRupee },
    { name: 'Documents', path: '/employee/documents', icon: HiOutlineDocumentText },
    { name: 'AI Assistant', path: '/employee/ai', icon: HiOutlineSparkles },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
          <h1 className="text-2xl font-bold text-primary-600">Dayflow</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) => `
                flex items-center px-3 py-2 text-sm font-medium rounded-md group transition-colors
                ${isActive 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <link.icon className={`
                    mr-3 flex-shrink-0 h-5 w-5 transition-colors
                    ${isActive ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {link.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold overflow-hidden">
              {user?.employee?.profilePhotoUrl ? (
                <img src={user.employee.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (user?.employee?.firstName || user?.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate w-40">
                {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
              </p>
              <p className="text-xs text-gray-500 truncate w-40">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-danger-600 rounded-md hover:bg-danger-50 transition-colors"
          >
            <HiOutlineLogout className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
