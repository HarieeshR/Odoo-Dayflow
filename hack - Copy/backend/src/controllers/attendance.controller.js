import * as attendanceService from '../services/attendance.service.js';
import * as auditService from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

const requireEmployee = (req) => {
  if (!req.user?.employee) {
    const error = new Error('No employee profile is linked to this account');
    error.statusCode = 400;
    throw error;
  }
  return req.user.employee;
};

export const checkIn = asyncHandler(async (req, res) => {
  const employee = requireEmployee(req);
  const result = await attendanceService.checkIn(employee);
  await auditService.createAuditLog({
    actorId: req.user._id,
    action: 'ATTENDANCE_CHECK_IN',
    entityType: 'Attendance',
    entityId: result._id,
    newValue: { checkIn: result.checkIn, date: result.date }
  });
  return successResponse(res, 'Checked in successfully', { record: result });
});

export const checkOut = asyncHandler(async (req, res) => {
  const employee = requireEmployee(req);
  const result = await attendanceService.checkOut(employee);
  await auditService.createAuditLog({
    actorId: req.user._id,
    action: 'ATTENDANCE_CHECK_OUT',
    entityType: 'Attendance',
    entityId: result._id,
    newValue: { checkOut: result.checkOut, workHours: result.workHours }
  });
  return successResponse(res, 'Checked out successfully', { record: result });
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getMyAttendance(requireEmployee(req), req.query);
  return successResponse(res, 'Attendance fetched successfully', result);
});

export const getAllAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAllAttendance(req.query);
  return successResponse(res, 'All attendance fetched successfully', result);
});

export const getAttendanceReports = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAttendanceReports(req.query);
  return successResponse(res, 'Attendance reports fetched successfully', result);
});
