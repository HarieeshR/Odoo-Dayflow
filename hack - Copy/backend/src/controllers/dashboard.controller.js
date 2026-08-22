import * as dashboardService from '../services/dashboard.service.js';
import { successResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getAdminDashboard();
  return successResponse(res, 'Admin dashboard stats retrieved successfully', stats);
});

export const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getEmployeeDashboard(req.user._id);
  return successResponse(res, 'Employee dashboard stats retrieved successfully', stats);
});
