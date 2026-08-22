import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import SalaryStructure from '../models/SalaryStructure.js';
import Employee from '../models/Employee.js';

export const getAttendanceReport = async ({ startDate, endDate, department }) => {
  let matchStage = {};
  
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  matchStage.date = { $gte: start, $lte: end };

  if (department) {
    const employees = await Employee.find({ department }).select('_id');
    matchStage.employee = { $in: employees.map(e => e._id) };
  }

  const pipeline = [
    { $match: matchStage },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalWorkHours: { $sum: '$workHours' },
              totalExtraHours: { $sum: '$extraHours' },
              lateArrivals: {
                $sum: {
                  $cond: [
                    { $and: [{ $ne: ['$checkIn', null] }, { $gt: [{ $hour: '$checkIn' }, 10] }] },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ],
        dailyBreakdown: [
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                day: { $dayOfMonth: '$date' },
                status: '$status'
              },
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ];

  const result = await Attendance.aggregate(pipeline);
  
  const summaryData = result[0].summary;
  let totalRecords = 0, presentCount = 0, absentCount = 0, halfDayCount = 0, leaveCount = 0;
  let totalWorkHours = 0, totalExtraHours = 0, totalLateArrivals = 0;

  summaryData.forEach(item => {
    totalRecords += item.count;
    totalWorkHours += item.totalWorkHours || 0;
    totalExtraHours += item.totalExtraHours || 0;
    totalLateArrivals += item.lateArrivals || 0;
    
    if (item._id === 'present') presentCount = item.count;
    if (item._id === 'absent') absentCount = item.count;
    if (item._id === 'half_day') halfDayCount = item.count;
    if (item._id === 'leave') leaveCount = item.count;
  });

  const dailyBreakdown = result[0].dailyBreakdown.map(item => ({
    date: new Date(item._id.year, item._id.month - 1, item._id.day),
    status: item._id.status,
    count: item.count
  }));

  return {
    summary: {
      totalRecords,
      presentCount,
      absentCount,
      halfDayCount,
      leaveCount,
      presentPercentage: totalRecords ? Math.round((presentCount / totalRecords) * 100) : 0,
      absentPercentage: totalRecords ? Math.round((absentCount / totalRecords) * 100) : 0,
      averageWorkHours: totalRecords ? Math.round((totalWorkHours / totalRecords) * 100) / 100 : 0,
      totalExtraHours: Math.round(totalExtraHours * 100) / 100,
      lateArrivals: totalLateArrivals
    },
    dailyBreakdown,
    departmentBreakdown: []
  };
};

export const getLeaveReport = async ({ startDate, endDate, department }) => {
  let matchStage = {};
  
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  matchStage.startDate = { $lte: end };
  matchStage.endDate = { $gte: start };

  let employeeIds = [];
  if (department) {
    const employees = await Employee.find({ department }).select('_id');
    employeeIds = employees.map(e => e._id);
    matchStage.employee = { $in: employeeIds };
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'leavetypes',
        localField: 'leaveType',
        foreignField: '_id',
        as: 'leaveTypeData'
      }
    },
    { $unwind: '$leaveTypeData' },
    {
      $lookup: {
        from: 'employees',
        localField: 'employee',
        foreignField: '_id',
        as: 'employeeData'
      }
    },
    { $unwind: '$employeeData' },
    {
      $facet: {
        statusBreakdown: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        typeDistribution: [
          { $group: { _id: '$leaveTypeData.name', count: { $sum: 1 } } }
        ],
        departmentDistribution: [
          { $group: { _id: '$employeeData.department', count: { $sum: 1 } } }
        ]
      }
    }
  ];

  const result = await LeaveRequest.aggregate(pipeline);
  
  let summary = { totalRequests: 0, pending: 0, approved: 0, rejected: 0 };
  result[0].statusBreakdown.forEach(item => {
    summary.totalRequests += item.count;
    if (item._id === 'pending') summary.pending = item.count;
    if (item._id === 'approved') summary.approved = item.count;
    if (item._id === 'rejected') summary.rejected = item.count;
  });

  return {
    summary,
    statusBreakdown: result[0].statusBreakdown,
    typeDistribution: result[0].typeDistribution,
    departmentDistribution: result[0].departmentDistribution
  };
};

export const getPayrollReport = async ({ department }) => {
  const matchStage = {};
  if (department) {
    const employees = await Employee.find({ department }).select('_id');
    matchStage.employee = { $in: employees.map(e => e._id) };
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'employees',
        localField: 'employee',
        foreignField: '_id',
        as: 'employeeData'
      }
    },
    { $unwind: '$employeeData' },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalPayroll: { $sum: '$netSalary' },
              averageSalary: { $avg: '$netSalary' },
              minSalary: { $min: '$netSalary' },
              maxSalary: { $max: '$netSalary' },
              totalEmployees: { $sum: 1 }
            }
          }
        ],
        departmentPayroll: [
          {
            $group: {
              _id: '$employeeData.department',
              totalPayroll: { $sum: '$netSalary' },
              employeeCount: { $sum: 1 }
            }
          }
        ],
        componentDistribution: [
          { $unwind: '$components' },
          {
            $group: {
              _id: '$components.name',
              totalAmount: { $sum: '$components.calculatedAmount' }
            }
          }
        ],
        deductionSummary: [
          { $unwind: '$deductions' },
          {
            $group: {
              _id: '$deductions.name',
              totalAmount: { $sum: '$deductions.calculatedAmount' }
            }
          }
        ]
      }
    }
  ];

  const result = await SalaryStructure.aggregate(pipeline);
  
  const summary = result[0].summary[0] || { totalPayroll: 0, averageSalary: 0, minSalary: 0, maxSalary: 0, totalEmployees: 0 };
  
  summary.totalPayroll = Math.round(summary.totalPayroll * 100) / 100;
  summary.averageSalary = Math.round(summary.averageSalary * 100) / 100;
  summary.minSalary = Math.round(summary.minSalary * 100) / 100;
  summary.maxSalary = Math.round(summary.maxSalary * 100) / 100;

  return {
    summary,
    departmentPayroll: result[0].departmentPayroll,
    componentDistribution: result[0].componentDistribution,
    deductionSummary: result[0].deductionSummary
  };
};
