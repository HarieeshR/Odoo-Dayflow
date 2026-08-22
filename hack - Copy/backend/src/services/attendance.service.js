import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import { paginatedData } from '../utils/apiResponse.js';
import { idOf, toUtcDateOnly } from '../utils/dates.js';

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const checkIn = async (employeeId) => {
  const empId = idOf(employeeId);
  const employee = await Employee.findById(empId);
  if (!employee || employee.employmentStatus !== 'active') {
    throw createError('Employee not found or not active', 404);
  }

  const today = toUtcDateOnly();

  let attendance = await Attendance.findOne({ employee: empId, date: today });
  
  if (attendance && attendance.checkIn) {
    throw createError('Already checked in today', 409);
  }

  if (!attendance) {
    attendance = new Attendance({
      employee: empId,
      date: today,
      checkIn: new Date(),
      status: 'present'
    });
  } else {
    attendance.checkIn = new Date();
    attendance.status = 'present';
  }

  try {
    await attendance.save();
  } catch (err) {
    if (err.code === 11000) {
      throw createError('Already checked in today', 409);
    }
    throw err;
  }
  return attendance;
};

export const checkOut = async (employeeId) => {
  const today = toUtcDateOnly();

  const attendance = await Attendance.findOne({ employee: idOf(employeeId), date: today });
  
  if (!attendance) {
    throw createError('No check-in found for today', 400);
  }
  
  if (attendance.checkOut) {
    throw createError('Already checked out today', 409);
  }

  if (!attendance.checkIn) {
    throw createError('Cannot check out without checking in', 400);
  }

  const checkOutTime = new Date();
  if (checkOutTime <= attendance.checkIn) {
    throw createError('Check-out time must be after check-in time', 400);
  }

  attendance.checkOut = checkOutTime;
  
  const workHoursRaw = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);
  attendance.workHours = Math.round(workHoursRaw * 100) / 100;
  
  attendance.extraHours = Math.max(0, Math.round((attendance.workHours - 8) * 100) / 100);

  if (attendance.workHours >= 8) {
    attendance.status = 'present';
  } else if (attendance.workHours >= 4) {
    attendance.status = 'half_day';
  } else {
    attendance.status = 'absent';
  }

  await attendance.save();
  return attendance;
};

export const getMyAttendance = async (employeeId, { startDate, endDate, page = 1, limit = 10, status }) => {
  const filter = { employee: idOf(employeeId) };
  
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = toUtcDateOnly(startDate);
    if (endDate) filter.date.$lte = toUtcDateOnly(endDate);
  }
  
  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [attendance, total] = await Promise.all([
    Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
    Attendance.countDocuments(filter)
  ]);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit)
  };
  return paginatedData('attendance', attendance, pagination);
};

export const getAllAttendance = async ({ search, startDate, endDate, page = 1, limit = 10, status, department }) => {
  let employeeFilter = {};
  if (search || department) {
    if (search) {
      employeeFilter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) {
      employeeFilter.department = department;
    }
  }

  const attendanceFilter = {};
  
  if (Object.keys(employeeFilter).length > 0) {
    const employees = await Employee.find(employeeFilter).select('_id');
    const employeeIds = employees.map(e => e._id);
    attendanceFilter.employee = { $in: employeeIds };
  }

  if (startDate || endDate) {
    attendanceFilter.date = {};
    if (startDate) attendanceFilter.date.$gte = toUtcDateOnly(startDate);
    if (endDate) attendanceFilter.date.$lte = toUtcDateOnly(endDate);
  }

  if (status) {
    attendanceFilter.status = status;
  }

  const skip = (page - 1) * limit;

  const [attendance, total] = await Promise.all([
    Attendance.find(attendanceFilter)
      .populate('employee', 'firstName lastName employeeId department profilePicture')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Attendance.countDocuments(attendanceFilter)
  ]);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit)
  };
  return paginatedData('attendance', attendance, pagination);
};

export const getAttendanceReports = async ({ startDate, endDate, department }) => {
  let matchStage = {};
  
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  matchStage.date = { $gte: start, $lte: end };

  let employeeIds = null;
  if (department) {
    const employees = await Employee.find({ department }).select('_id');
    employeeIds = employees.map(e => e._id);
    matchStage.employee = { $in: employeeIds };
  }

  const results = await Attendance.aggregate([
    { $match: matchStage },
    { 
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalWorkHours: { $sum: '$workHours' },
        totalExtraHours: { $sum: '$extraHours' }
      }
    }
  ]);

  let totalRecords = 0;
  let presentCount = 0;
  let absentCount = 0;
  let halfDayCount = 0;
  let leaveCount = 0;
  let sumWorkHours = 0;
  let totalExtraHours = 0;

  results.forEach(res => {
    totalRecords += res.count;
    sumWorkHours += res.totalWorkHours;
    totalExtraHours += res.totalExtraHours;
    if (res._id === 'present') presentCount = res.count;
    if (res._id === 'absent') absentCount = res.count;
    if (res._id === 'half_day') halfDayCount = res.count;
    if (res._id === 'leave') leaveCount = res.count;
  });

  return {
    totalRecords,
    presentCount,
    absentCount,
    halfDayCount,
    leaveCount,
    presentPercentage: totalRecords ? Math.round((presentCount / totalRecords) * 100) : 0,
    absentPercentage: totalRecords ? Math.round((absentCount / totalRecords) * 100) : 0,
    leavePercentage: totalRecords ? Math.round((leaveCount / totalRecords) * 100) : 0,
    averageWorkHours: totalRecords ? Math.round((sumWorkHours / totalRecords) * 100) / 100 : 0,
    avgWorkHours: totalRecords ? Math.round((sumWorkHours / totalRecords) * 100) / 100 : 0,
    totalExtraHours: Math.round(totalExtraHours * 100) / 100
  };
};
