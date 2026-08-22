import * as employeeService from '../services/employee.service.js';
import { successResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createEmployee = asyncHandler(async (req, res) => {
  const employeeData = req.body;
  
  if (req.file) {
    employeeData.profilePicture = req.file.path.replace(/\\/g, '/');
  }
  
  const result = await employeeService.createEmployee(employeeData, req.user._id);
  return successResponse(res, 'Employee created successfully', result, 201);
});

export const listEmployees = asyncHandler(async (req, res) => {
  const result = await employeeService.listEmployees(req.query);
  return successResponse(res, 'Employees retrieved successfully', result);
});

export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployee(req.params.id);
  return successResponse(res, 'Employee retrieved successfully', employee);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employeeData = req.body;
  
  if (req.file) {
    employeeData.profilePicture = req.file.path.replace(/\\/g, '/');
  }
  
  const employee = await employeeService.updateEmployee(req.params.id, employeeData, req.user._id);
  return successResponse(res, 'Employee updated successfully', employee);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateStatus(req.params.id, req.body.status, req.user._id);
  return successResponse(res, 'Employee status updated successfully', employee);
});

export const resetCredentials = asyncHandler(async (req, res) => {
  const result = await employeeService.resetCredentials(req.params.id, req.user._id);
  return successResponse(res, 'Credentials reset successfully', result);
});
