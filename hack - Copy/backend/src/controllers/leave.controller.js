import * as leaveService from '../services/leave.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const createRequest = asyncHandler(async (req, res) => {
  if (req.file) {
    req.body.attachment = req.file.path.replace(/\\/g, '/');
  }
  const result = await leaveService.createRequest(req.user.employee, req.body);
  return successResponse(res, 'Leave request created successfully', result, 201);
});

export const approveRequest = asyncHandler(async (req, res) => {
  const result = await leaveService.approveRequest(req.params.id, req.user._id, req.body.comments);
  return successResponse(res, 'Leave request approved', result);
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const result = await leaveService.rejectRequest(req.params.id, req.user._id, req.body.comments);
  return successResponse(res, 'Leave request rejected', result);
});

export const getMyRequests = asyncHandler(async (req, res) => {
  const result = await leaveService.getMyRequests(req.user.employee, req.query);
  return successResponse(res, 'Leave requests fetched successfully', result);
});

export const getMyBalance = asyncHandler(async (req, res) => {
  const result = await leaveService.getMyBalance(req.user.employee);
  return successResponse(res, 'Leave balance fetched successfully', result);
});

export const getAllRequests = asyncHandler(async (req, res) => {
  const result = await leaveService.getAllRequests(req.query);
  return successResponse(res, 'All leave requests fetched successfully', result);
});

export const getAllBalances = asyncHandler(async (req, res) => {
  const result = await leaveService.getAllBalances(req.query);
  return successResponse(res, 'All leave balances fetched successfully', result);
});

export const adjustBalance = asyncHandler(async (req, res) => {
  const leaveTypeId = req.body.leaveTypeId || req.body.leaveType;
  const adjustment = req.body.adjustment ?? req.body.adjustmentAmount;
  const result = await leaveService.adjustBalance(req.params.employeeId, leaveTypeId, adjustment, req.user._id);
  return successResponse(res, 'Leave balance adjusted successfully', result);
});
