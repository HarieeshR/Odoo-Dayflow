import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import LeaveType from '../models/LeaveType.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import * as auditService from './audit.service.js';
import * as notificationService from './notification.service.js';
import { paginatedData } from '../utils/apiResponse.js';
import { idOf, toUtcDateOnly } from '../utils/dates.js';

const fail = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const mapBalance = (b) => ({
  _id: b._id,
  leaveTypeId: b.leaveType?._id || b.leaveType,
  leaveType: b.leaveType?.name || b.leaveType?.code || '',
  remainingDays: b.remainingDays,
  totalDays: b.totalDays,
  usedDays: b.usedDays,
  year: b.year,
  employee: b.employee,
  requiresAttachment: Boolean(b.leaveType?.requiresAttachment)
});

export const createRequest = async (employeeId, data) => {
  const employee = await Employee.findById(idOf(employeeId));
  if (!employee || employee.employmentStatus !== 'active') fail('Employee not found or inactive', 404);

  const empId = employee._id;
  const leaveType = await LeaveType.findById(data.leaveType);
  if (!leaveType || !leaveType.isActive) fail('Invalid leave type');

  const startDate = toUtcDateOnly(data.startDate);
  const endDate = toUtcDateOnly(data.endDate);

  if (endDate < startDate) fail('End date must be after or equal to start date');

  const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  const overlapping = await LeaveRequest.findOne({
    employee: empId,
    status: { $ne: 'rejected' },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  });

  if (overlapping) fail('Leave request overlaps with an existing request');

  const currentYear = new Date().getFullYear();
  const balance = await LeaveBalance.findOne({ employee: empId, leaveType: data.leaveType, year: currentYear });

  if (!balance || balance.remainingDays < totalDays) {
    fail('Insufficient leave balance');
  }

  if (leaveType.requiresAttachment && !data.attachment) {
    fail('Attachment is required for this leave type');
  }

  const request = await LeaveRequest.create({
    employee: empId,
    leaveType: data.leaveType,
    startDate,
    endDate,
    totalDays,
    reason: data.reason,
    attachment: data.attachment
  });

  const admins = await User.find({ role: 'admin', isActive: true });
  for (const admin of admins) {
    await notificationService.createNotification({
      recipientId: admin._id,
      title: 'New Leave Request',
      message: `${employee.firstName} ${employee.lastName} applied for leave`,
      type: 'leave_submitted',
      metadata: { entityType: 'LeaveRequest', entityId: request._id }
    });
  }

  if (employee.user) {
    await auditService.createAuditLog({
      actorId: employee.user,
      action: 'LEAVE_APPLY',
      entityType: 'LeaveRequest',
      entityId: request._id,
      newValue: { totalDays, startDate, endDate }
    });
  }

  return request;
};

export const approveRequest = async (requestId, adminUserId, comments) => {
  const request = await LeaveRequest.findById(requestId).populate('employee');
  if (!request) fail('Leave request not found', 404);
  if (request.status !== 'pending') fail('Leave request is not pending');

  request.status = 'approved';
  request.reviewedBy = adminUserId;
  request.reviewedAt = new Date();
  request.reviewComments = comments;

  const currentYear = new Date(request.startDate).getFullYear();
  const balance = await LeaveBalance.findOne({
    employee: request.employee._id,
    leaveType: request.leaveType,
    year: currentYear
  });

  if (balance) {
    balance.usedDays += request.totalDays;
    await balance.save();
  }

  const currentDate = toUtcDateOnly(request.startDate);
  const end = toUtcDateOnly(request.endDate);

  while (currentDate <= end) {
    await Attendance.findOneAndUpdate(
      { employee: request.employee._id, date: new Date(currentDate) },
      { status: 'leave' },
      { upsert: true }
    );
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  await request.save();

  if (request.employee.user) {
    await notificationService.createNotification({
      recipientId: request.employee.user,
      title: 'Leave Approved',
      message: `Your leave request from ${request.startDate.toDateString()} to ${request.endDate.toDateString()} has been approved.`,
      type: 'leave_approved',
      metadata: { entityType: 'LeaveRequest', entityId: request._id }
    });
  }

  await auditService.createAuditLog({
    actorId: adminUserId,
    action: 'LEAVE_APPROVE',
    entityType: 'LeaveRequest',
    entityId: request._id,
    newValue: { comments }
  });

  return request;
};

export const rejectRequest = async (requestId, adminUserId, comments) => {
  const request = await LeaveRequest.findById(requestId).populate('employee');
  if (!request) fail('Leave request not found', 404);
  if (request.status !== 'pending') fail('Leave request is not pending');

  request.status = 'rejected';
  request.reviewedBy = adminUserId;
  request.reviewedAt = new Date();
  request.reviewComments = comments;

  await request.save();

  if (request.employee.user) {
    await notificationService.createNotification({
      recipientId: request.employee.user,
      title: 'Leave Rejected',
      message: `Your leave request from ${request.startDate.toDateString()} to ${request.endDate.toDateString()} has been rejected.`,
      type: 'leave_rejected',
      metadata: { entityType: 'LeaveRequest', entityId: request._id }
    });
  }

  await auditService.createAuditLog({
    actorId: adminUserId,
    action: 'LEAVE_REJECT',
    entityType: 'LeaveRequest',
    entityId: request._id,
    newValue: { comments }
  });

  return request;
};

export const getMyRequests = async (employeeId, { status, startDate, endDate, page = 1, limit = 10 }) => {
  const filter = { employee: idOf(employeeId) };
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = toUtcDateOnly(startDate);
    if (endDate) filter.startDate.$lte = toUtcDateOnly(endDate);
  }

  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    LeaveRequest.find(filter).populate('leaveType').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    LeaveRequest.countDocuments(filter)
  ]);

  const pagination = { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) };
  return paginatedData('requests', requests, pagination);
};

export const getMyBalance = async (employeeId) => {
  const currentYear = new Date().getFullYear();
  const balances = await LeaveBalance.find({ employee: idOf(employeeId), year: currentYear }).populate('leaveType', 'name code requiresAttachment');
  const balance = balances.map(mapBalance);
  return { balance, balances: balance };
};

export const getAllRequests = async ({ search, status, startDate, endDate, page = 1, limit = 10 }) => {
  let employeeFilter = {};
  if (search) {
    employeeFilter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }

  const filter = {};
  if (Object.keys(employeeFilter).length > 0) {
    const employees = await Employee.find(employeeFilter).select('_id');
    filter.employee = { $in: employees.map(e => e._id) };
  }

  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = toUtcDateOnly(startDate);
    if (endDate) filter.startDate.$lte = toUtcDateOnly(endDate);
  }

  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    LeaveRequest.find(filter).populate('employee').populate('leaveType').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    LeaveRequest.countDocuments(filter)
  ]);

  const pagination = { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) };
  return paginatedData('requests', requests, pagination);
};

export const getAllBalances = async ({ search, department, page = 1, limit = 10 }) => {
  const employeeFilter = {};
  if (search) {
    employeeFilter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }
  if (department) employeeFilter.department = department;

  const currentYear = new Date().getFullYear();
  const skip = (page - 1) * limit;

  const [employees, total] = await Promise.all([
    Employee.find(employeeFilter).sort({ employeeId: 1 }).skip(skip).limit(parseInt(limit)),
    Employee.countDocuments(employeeFilter)
  ]);

  const empIds = employees.map(e => e._id);
  const balances = await LeaveBalance.find({ employee: { $in: empIds }, year: currentYear }).populate('leaveType', 'name code requiresAttachment');

  const byEmployee = new Map(employees.map(e => [e._id.toString(), { employee: e, balance: [] }]));
  for (const b of balances) {
    const key = b.employee.toString();
    if (byEmployee.has(key)) {
      byEmployee.get(key).balance.push(mapBalance(b));
    }
  }

  const records = Array.from(byEmployee.values());
  const pagination = { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) };
  return paginatedData('balances', records, pagination);
};

export const adjustBalance = async (employeeId, leaveTypeId, adjustment, adminUserId) => {
  const currentYear = new Date().getFullYear();
  const balance = await LeaveBalance.findOne({
    employee: idOf(employeeId),
    leaveType: leaveTypeId,
    year: currentYear
  });

  if (!balance) fail('Leave balance not found', 404);

  balance.totalDays += Number(adjustment);
  if (balance.totalDays < 0) balance.totalDays = 0;
  await balance.save();

  const employee = await Employee.findById(idOf(employeeId));

  await auditService.createAuditLog({
    actorId: adminUserId,
    action: 'LEAVE_BALANCE_ADJUST',
    entityType: 'LeaveBalance',
    entityId: balance._id,
    newValue: { adjustment, newTotal: balance.totalDays }
  });

  if (employee?.user) {
    await notificationService.createNotification({
      recipientId: employee.user,
      title: 'Leave Balance Adjusted',
      message: `Your leave balance has been adjusted by ${adjustment} days.`,
      type: 'hr_alert',
      metadata: { entityType: 'LeaveBalance', entityId: balance._id }
    });
  }

  return balance;
};
