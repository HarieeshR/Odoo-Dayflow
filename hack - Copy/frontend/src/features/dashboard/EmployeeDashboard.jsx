import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { HiOutlineUser, HiOutlineClock, HiOutlineCalendar, HiOutlineCurrencyRupee, HiOutlineBell, HiCheck } from 'react-icons/hi';
import * as dashboardService from '../../services/dashboardService';
import * as notificationService from '../../services/notificationService';
import * as attendanceService from '../../services/attendanceService';
import * as leaveService from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { asRecord, leaveTypeName, listItems } from '../../utils/response';
import Avatar from '../../components/ui/Avatar';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New states for Attendance and Leave
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState([]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getEmployeeDashboard();
      if (response.success) {
        setData(response.data);
        if (response.data.todayAttendance) setTodayAttendance(response.data.todayAttendance);
        if (response.data.leaveBalances?.length) {
          setLeaveBalance(response.data.leaveBalances.map((b) => ({
            ...b,
            leaveTypeId: b.leaveType?._id || b.leaveType,
            remainingDays: b.remainingDays ?? ((b.totalDays || 0) - (b.usedDays || 0))
          })));
        }
      }
      else setError('Failed to fetch dashboard data');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceAndLeave = async () => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const attRes = await attendanceService.getMyAttendance({ startDate: todayStr, endDate: todayStr, limit: 1 });
      if (attRes.success && listItems(attRes.data).length > 0) {
        setTodayAttendance(listItems(attRes.data)[0]);
      }

      const lvRes = await leaveService.getMyLeaveBalance();
      if (lvRes.success) {
        setLeaveBalance(lvRes.data.balance || listItems(lvRes.data));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAttendanceAndLeave();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setData(prev => ({
        ...prev,
        recentNotifications: prev.recentNotifications.map(n => 
          n._id === id ? { ...n, isRead: true } : n
        )
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceService.checkIn();
      if (res.success) {
        toast.success('Checked in successfully!');
        setTodayAttendance(asRecord(res.data));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceService.checkOut();
      if (res.success) {
        toast.success('Checked out successfully!');
        setTodayAttendance(asRecord(res.data));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-12"><LoadingSpinner size="lg" /></div>;
  if (error || !data) return <ErrorState message={error} onRetry={() => { fetchDashboard(); fetchAttendanceAndLeave(); }} />;

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');
  const now = format(new Date(), 'h:mm a');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-primary-600 rounded-lg p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar person={data.employee || user?.employee} size="xl" className="ring-4 ring-white/30" />
          <div>
            <h1 className="text-2xl font-bold">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {data.employee?.firstName || user?.employee?.firstName || user?.email}!</h1>
            <p className="mt-1 text-primary-100">{today}</p>
            <p className="mt-1 text-sm text-primary-200">
              {data.employee?.designation || 'Employee'}
              {data.employee?.department ? ` • ${data.employee.department}` : ''}
              {data.employee?.employeeId ? ` • ${data.employee.employeeId}` : ''}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-xl font-bold font-mono bg-white/20 px-4 py-2 rounded-lg">
          {now}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 flex items-center">
              <div className="p-3 rounded-full bg-primary-50 text-primary-600 mr-4">
                <HiOutlineUser className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-semibold text-gray-900">{data.employee?.employeeId || '-'}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center">
              <div className="p-3 rounded-full bg-primary-50 text-primary-600 mr-4">
                <HiOutlineCalendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Joining Date</p>
                <p className="font-semibold text-gray-900">
                  {data.employee?.joiningDate ? format(new Date(data.employee.joiningDate), 'MMM d, yyyy') : '-'}
                </p>
              </div>
            </Card>
            <Card className="p-4 flex items-center">
              <div className="p-3 rounded-full bg-primary-50 text-primary-600 mr-4">
                <HiOutlineClock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-semibold text-gray-900">{data.employee?.department || '-'}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center">
              <div className="p-3 rounded-full bg-primary-50 text-primary-600 mr-4">
                <HiOutlineUser className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Designation</p>
                <p className="font-semibold text-gray-900">{data.employee?.designation || '-'}</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Real Attendance Module */}
            <Card title="Attendance Today">
              <div className="text-center py-6">
                {!todayAttendance?.checkIn && (
                  <>
                    <p className="text-gray-500 mb-4">You haven't checked in yet.</p>
                    <Button onClick={handleCheckIn} loading={actionLoading} className="bg-success-600 hover:bg-success-700">
                      Check In Now
                    </Button>
                  </>
                )}
                {todayAttendance?.checkIn && !todayAttendance?.checkOut && (
                  <>
                    <p className="text-gray-500 mb-2">Checked in at {format(new Date(todayAttendance.checkIn), 'h:mm a')}</p>
                    <p className="font-medium text-primary-600 mb-4">You are currently working.</p>
                    <Button onClick={handleCheckOut} loading={actionLoading} className="bg-warning-500 hover:bg-warning-600">
                      Check Out
                    </Button>
                  </>
                )}
                {todayAttendance?.checkIn && todayAttendance?.checkOut && (
                  <>
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-success-100 text-success-600 mb-3">
                      <HiCheck className="h-6 w-6" />
                    </div>
                    <p className="font-medium text-gray-900">Work completed for today</p>
                    <p className="text-sm text-gray-500 mt-1">Total Hours: {todayAttendance.workHours?.toFixed(2)}h</p>
                  </>
                )}
              </div>
            </Card>
            
            {/* Real Leave Balance */}
            <Card title="Leave Balance">
              <div className="py-2 space-y-4">
                {leaveBalance.length > 0 ? leaveBalance.slice(0, 3).map(b => (
                  <div key={b.leaveTypeId || b._id || leaveTypeName(b.leaveType)}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{leaveTypeName(b.leaveType).toUpperCase()}</span>
                      <span className="text-gray-500">{b.remainingDays} left</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, (b.usedDays / b.totalDays) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No leave balances found.</p>
                )}
                <div className="text-center pt-2">
                  <Link to="/employee/leave" className="text-sm font-medium text-primary-600 hover:text-primary-800">
                    Apply Leave
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Quick Links */}
          <Card title="Quick Links">
            <div className="space-y-2 mt-2">
              <Link to="/employee/profile" className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-center">
                  <HiOutlineUser className="mr-3 h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">My Profile</span>
                </div>
              </Link>
              <Link to="/employee/attendance" className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-center">
                  <HiOutlineClock className="mr-3 h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Attendance Details</span>
                </div>
              </Link>
              <Link to="/employee/leave" className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-center">
                  <HiOutlineCalendar className="mr-3 h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Leave Requests</span>
                </div>
              </Link>
              <Link to="/employee/salary" className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-center">
                  <HiOutlineCurrencyRupee className="mr-3 h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Salary</span>
                </div>
              </Link>
            </div>
          </Card>

          {/* Recent Notifications */}
          <Card title="Recent Notifications">
            <div className="mt-4 space-y-4">
              {data.recentNotifications && data.recentNotifications.length > 0 ? (
                data.recentNotifications.map((notif) => (
                  <div key={notif._id} className={`p-3 rounded-lg border ${notif.isRead ? 'bg-white border-gray-100' : 'bg-primary-50 border-primary-100'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <p className={`text-sm ${notif.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(notif._id)}
                          className="text-primary-600 hover:text-primary-800 p-1"
                          title="Mark as read"
                        >
                          <HiCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <HiOutlineBell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm">No new notifications</p>
                </div>
              )}
            </div>
            {data.recentNotifications && data.recentNotifications.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <Link to="/employee/notifications" className="text-sm font-medium text-primary-600 hover:text-primary-800">
                  View All
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
