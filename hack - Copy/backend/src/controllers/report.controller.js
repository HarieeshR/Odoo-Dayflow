import * as reportService from '../services/report.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getAttendanceReport = asyncHandler(async (req, res) => {
  const result = await reportService.getAttendanceReport(req.query);
  return successResponse(res, 'Attendance report fetched successfully', result);
});

export const getLeaveReport = asyncHandler(async (req, res) => {
  const result = await reportService.getLeaveReport(req.query);
  return successResponse(res, 'Leave report fetched successfully', result);
});

export const getPayrollReport = asyncHandler(async (req, res) => {
  const result = await reportService.getPayrollReport(req.query);
  return successResponse(res, 'Payroll report fetched successfully', result);
});
