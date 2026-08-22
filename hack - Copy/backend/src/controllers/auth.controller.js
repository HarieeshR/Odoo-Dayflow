import { successResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const signup = asyncHandler(async (req, res) => {
  const data = req.body;
  
  // Handle profile picture upload
  if (req.file) {
    data.profilePicture = req.file.path.replace(/\\/g, '/');
  }
  
  const result = await authService.signup(data);
  return successResponse(res, 'Account created successfully', result, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return successResponse(res, 'Login successful', result);
});

export const logout = asyncHandler(async (req, res) => {
  return successResponse(res, 'Logout successful');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;
  await authService.changePassword(userId, currentPassword, newPassword);
  return successResponse(res, 'Password changed successfully');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  return successResponse(res, 'Password reset email sent', result || {});
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  return successResponse(res, 'Password reset successfully');
});
