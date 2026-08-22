import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import { toUtcDateOnly } from '../utils/dates.js';

export const getAdminDashboard = async () => {
  const [activeEmployees, inactiveEmployees, pendingLeaveRequests] = await Promise.all([
    Employee.countDocuments({ employmentStatus: 'active' }),
    Employee.countDocuments({ employmentStatus: { $ne: 'active' } }),
    LeaveRequest.countDocuments({ status: 'pending' })
  ]);
  const totalEmployees = activeEmployees + inactiveEmployees;

  let presentToday = 0;
  let absentToday = 0;
  let onLeave = 0;
  let recentLeaveRequests = [];

  try {
    const today = toUtcDateOnly();
    const attendances = await Attendance.find({ date: today });
    presentToday = attendances.filter(a => a.status === 'present' || a.status === 'half_day').length;
    onLeave = attendances.filter(a => a.status === 'leave').length;
    absentToday = Math.max(0, activeEmployees - presentToday - onLeave);

    recentLeaveRequests = await LeaveRequest.find({ status: 'pending' })
      .populate('employee', 'firstName lastName employeeId profilePicture department')
      .populate('leaveType', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);
  } catch (error) {
    console.error('Error fetching dynamic stats', error);
  }

  const recentEmployees = await Employee.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'email role');

  const departmentDistribution = await Employee.aggregate([
    { $match: { employmentStatus: 'active' } },
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    presentToday,
    absentToday,
    onLeave,
    employeesOnLeave: onLeave,
    pendingLeaveRequests,
    recentEmployees,
    recentLeaveRequests,
    departmentDistribution,
    departmentBreakdown: departmentDistribution
  };
};

export const getEmployeeDashboard = async (userId) => {
  const employee = await Employee.findOne({ user: userId });

  let todayAttendance = null;
  let leaveBalances = [];
  let pendingLeaveRequests = 0;

  try {
    const today = toUtcDateOnly();

    if (employee) {
      todayAttendance = await Attendance.findOne({ employee: employee._id, date: today });
      const currentYear = new Date().getFullYear();
      leaveBalances = await LeaveBalance.find({ employee: employee._id, year: currentYear }).populate('leaveType', 'name code');
      pendingLeaveRequests = await LeaveRequest.countDocuments({ employee: employee._id, status: 'pending' });
    }
  } catch (error) {
    console.error('Error fetching employee dynamic stats', error);
  }

  const recentNotifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    employee,
    todayAttendance,
    leaveBalances,
    pendingLeaveRequests,
    recentNotifications
  };
};
