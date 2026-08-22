import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import LeaveBalance from '../models/LeaveBalance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import SalaryStructure from '../models/SalaryStructure.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import LeaveType from '../models/LeaveType.js';

export const buildEmployeeContext = async (employeeId) => {
  const employee = await Employee.findById(employeeId)
    .populate('department')
    .lean();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const attendances = await Attendance.find({
    employee: employeeId,
    date: { $gte: startOfMonth }
  }).lean();

  const totalDaysWorked = attendances.filter(a => ['present', 'half_day'].includes(a.status)).length;
  const presentCount = attendances.filter(a => a.status === 'present').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;
  const halfDayCount = attendances.filter(a => a.status === 'half_day').length;
  
  const totalWorkHours = attendances.reduce((acc, a) => acc + (a.workHours || 0), 0);
  const avgWorkHours = totalDaysWorked > 0 ? (totalWorkHours / totalDaysWorked).toFixed(2) : 0;
  const totalExtraHours = attendances.reduce((acc, a) => acc + (a.extraHours || 0), 0);

  const currentYear = new Date().getFullYear();
  const leaveBalances = await LeaveBalance.find({
    employee: employeeId,
    year: currentYear
  }).populate('leaveType').lean();

  const formattedLeaveBalances = leaveBalances.map(lb => ({
    type: lb.leaveType?.name || 'Unknown',
    totalDays: lb.totalDays,
    usedDays: lb.usedDays,
    remainingDays: lb.totalDays - lb.usedDays
  }));

  const salaryStructure = await SalaryStructure.findOne({
    employee: employeeId,
    isActive: true
  }).lean();

  const pendingLeaveRequests = await LeaveRequest.countDocuments({
    employee: employeeId,
    status: 'pending'
  });

  return {
    employeeDetails: {
      name: `${employee.firstName} ${employee.lastName}`,
      department: employee.department || 'N/A',
      designation: employee.designation,
      joiningDate: employee.joiningDate
    },
    attendanceSummary: {
      totalDaysWorked,
      presentCount,
      absentCount,
      halfDayCount,
      avgWorkHours,
      totalExtraHours
    },
    leaveBalances: formattedLeaveBalances,
    salarySummary: salaryStructure ? {
      monthlyWage: salaryStructure.monthlyWage,
      netSalary: salaryStructure.netSalary,
      totalEarnings: salaryStructure.totalEarnings,
      totalDeductions: salaryStructure.totalDeductions
    } : 'Not Available',
    pendingLeaveRequestsCount: pendingLeaveRequests
  };
};

export const buildAdminContext = async () => {
  const totalEmployees = await Employee.countDocuments();
  const activeEmployees = await Employee.countDocuments({ status: 'active' });
  const inactiveEmployees = totalEmployees - activeEmployees;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysAttendances = await Attendance.find({ date: { $gte: today } }).lean();
  const presentToday = todaysAttendances.filter(a => a.status === 'present' || a.status === 'half_day').length;
  const absentToday = todaysAttendances.filter(a => a.status === 'absent').length;
  const onLeaveToday = todaysAttendances.filter(a => a.status === 'on_leave').length;

  const pendingRequests = await LeaveRequest.find({ status: 'pending' })
    .populate('employee', 'firstName lastName')
    .populate('leaveType', 'name')
    .lean();
    
  const pendingRequestsList = pendingRequests.map(r => ({
    employeeName: `${r.employee?.firstName} ${r.employee?.lastName}`,
    type: r.leaveType?.name || 'Unknown',
    startDate: r.startDate,
    endDate: r.endDate
  }));

  const employees = await Employee.find({ status: 'active' }).lean();
  const deptMap = {};
  employees.forEach(emp => {
    const dept = emp.department || 'Unassigned';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });

  const salaryStructures = await SalaryStructure.find({ isActive: true }).lean();
  const totalMonthlyPayroll = salaryStructures.reduce((acc, s) => acc + s.netSalary, 0);
  const averageSalary = salaryStructures.length > 0 ? (totalMonthlyPayroll / salaryStructures.length).toFixed(2) : 0;

  const recentAudits = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'email')
    .lean();

  const formattedAudits = recentAudits.map(a => ({
    action: a.action,
    entity: a.entityType,
    user: a.user?.email || 'System',
    date: a.createdAt
  }));

  return {
    employeesSummary: {
      total: totalEmployees,
      active: activeEmployees,
      inactive: inactiveEmployees
    },
    todayAttendance: {
      present: presentToday,
      absent: absentToday,
      onLeave: onLeaveToday
    },
    leaveRequests: {
      pendingCount: pendingRequests.length,
      list: pendingRequestsList
    },
    departmentBreakdown: deptMap,
    payrollSummary: {
      totalMonthlyPayroll,
      averageSalary
    },
    recentAudits: formattedAudits
  };
};

export const buildSystemPrompt = (role) => {
  if (role === 'employee') {
    return "You are Dayflow HR Assistant. You help employees with their HR queries. You can ONLY provide information about the requesting employee's own data. Never reveal other employees' data. Be concise, professional, and helpful. Format responses with bullet points where appropriate. If you don't have data to answer, say so clearly.";
  }
  
  if (role === 'admin') {
    return "You are Dayflow HR Assistant for administrators. You help HR/Admin with organizational insights, employee data analysis, attendance patterns, leave statistics, and payroll overview. Provide data-driven responses. Use bullet points and numbers. If asked to take actions (fire, penalize, change salary), clarify that you can only provide analysis and recommendations — actions must be taken through the system.";
  }
  
  return "You are Dayflow HR Assistant.";
};
