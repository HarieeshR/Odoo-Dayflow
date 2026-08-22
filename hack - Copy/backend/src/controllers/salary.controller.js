import * as salaryService from '../services/salary.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getMySalary = asyncHandler(async (req, res) => {
  const result = await salaryService.getMySalary(req.user.employee);
  return successResponse(res, 'My salary fetched successfully', result);
});

export const getEmployeeSalary = asyncHandler(async (req, res) => {
  const result = await salaryService.getEmployeeSalary(req.params.id);
  return successResponse(res, 'Employee salary fetched successfully', result);
});

export const updateSalary = asyncHandler(async (req, res) => {
  const result = await salaryService.updateSalary(req.params.id, req.body, req.user._id);
  return successResponse(res, 'Salary updated successfully', result);
});

export const getSalaryHistory = asyncHandler(async (req, res) => {
  const result = await salaryService.getSalaryHistory(req.params.employeeId);
  return successResponse(res, 'Salary history fetched successfully', result);
});
