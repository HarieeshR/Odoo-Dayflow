import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { HiOutlineUsers, HiOutlineUserAdd, HiOutlineClock, HiOutlineCalendar, HiOutlineCurrencyRupee } from 'react-icons/hi';
import * as dashboardService from '../../services/dashboardService';
import { useAuth } from '../../context/AuthContext';
import { displayName } from '../../utils/response';
import Avatar from '../../components/ui/Avatar';
import { leaveTypeName } from '../../utils/response';

import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getAdminDashboard();
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-12"><LoadingSpinner size="lg" /></div>;
  if (error || !data) return <ErrorState message={error} onRetry={fetchDashboard} />;

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-primary-600 rounded-lg p-6 text-white shadow-md flex items-center gap-4">
        <Avatar person={user?.employee} size="lg" className="ring-4 ring-white/30" />
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {displayName(user)}! 👋</h1>
          <p className="mt-1 text-primary-100">{today}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="flex items-center p-4">
          <div className="p-3 rounded-full bg-primary-100 text-primary-600 mr-4">
            <HiOutlineUsers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900">{data.totalEmployees || 0}</p>
          </div>
        </Card>
        <Card className="flex items-center p-4">
          <div className="p-3 rounded-full bg-success-100 text-success-600 mr-4">
            <HiOutlineClock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Present Today</p>
            <p className="text-2xl font-bold text-gray-900">{data.presentToday || 0}</p>
          </div>
        </Card>
        <Card className="flex items-center p-4">
          <div className="p-3 rounded-full bg-danger-100 text-danger-600 mr-4">
            <HiOutlineUsers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Absent Today</p>
            <p className="text-2xl font-bold text-gray-900">{data.absentToday || 0}</p>
          </div>
        </Card>
        
        <Card className="flex items-center p-4">
          <div className="p-3 rounded-full bg-warning-100 text-warning-600 mr-4">
            <HiOutlineCalendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Leaves</p>
            <p className="text-2xl font-bold text-gray-900">{data.pendingLeaveRequests || 0}</p>
          </div>
        </Card>
        <Card className="flex items-center p-4">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <HiOutlineClock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">On Leave Today</p>
            <p className="text-2xl font-bold text-gray-900">{data.employeesOnLeave || data.onLeave || 0}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card title="Department Breakdown" className="lg:col-span-2">
          <div className="h-72 w-full mt-4">
            {data.departmentBreakdown && data.departmentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departmentBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">No data available</div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="space-y-3 mt-2">
            <Link to="/admin/employees/create" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-primary-50 rounded-md text-primary-600 mr-3">
                <HiOutlineUserAdd className="h-5 w-5" />
              </div>
              <span className="font-medium text-gray-700">Add Employee</span>
            </Link>
            <Link to="/admin/attendance" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-success-50 rounded-md text-success-600 mr-3">
                <HiOutlineClock className="h-5 w-5" />
              </div>
              <span className="font-medium text-gray-700">View Attendance</span>
            </Link>
            <Link to="/admin/leave" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-warning-50 rounded-md text-warning-600 mr-3">
                <HiOutlineCalendar className="h-5 w-5" />
              </div>
              <span className="font-medium text-gray-700">Leave Approvals</span>
            </Link>
            <Link to="/admin/payroll" className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-indigo-50 rounded-md text-indigo-600 mr-3">
                <HiOutlineCurrencyRupee className="h-5 w-5" />
              </div>
              <span className="font-medium text-gray-700">Run Payroll</span>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees Table */}
        <Card title="Recent Employees">
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recentEmployees && data.recentEmployees.length > 0 ? (
                  data.recentEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold mr-3">
                            {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</div>
                            <div className="text-xs text-gray-500">{emp.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/admin/employees/${emp._id}`} className="text-primary-600 hover:text-primary-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      No recent employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Pending Leaves Table (Mocked since we just add it based on requirement) */}
        <Card title="Recent Pending Leaves">
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Dates</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recentLeaveRequests && data.recentLeaveRequests.length > 0 ? (
                  data.recentLeaveRequests.map((leave) => {
                    const leaveTypeLabel = typeof leave.leaveType === 'string'
                      ? leave.leaveType.replace('_', ' ').toUpperCase()
                      : leave.leaveType?.name || leave.leaveType?.code || 'Leave';

                    return (
                      <tr key={leave._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {leave.employee?.firstName} {leave.employee?.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{leaveTypeLabel}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to="/admin/leave" className="text-primary-600 hover:text-primary-900">
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      No pending leave requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
