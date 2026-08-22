import crypto from 'crypto';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { ERROR_CODES } from '../constants/errors.js';
import { generateToken } from '../utils/generateToken.js';
import { generateEmployeeId } from '../utils/generateEmployeeId.js';
import { createNotification } from './notification.service.js';
import { createAuditLog } from './audit.service.js';
import LeaveType from '../models/LeaveType.js';
import LeaveBalance from '../models/LeaveBalance.js';

const createError = (message, code, statusCode = 400) => {
  const error = new Error(message);
  error.customErrorCode = code;
  error.status = statusCode;
  return error;
};

export const signup = async (data) => {
  const { employeeId, email, password, role, firstName, lastName, phone, department, designation } = data;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('Email is already registered', ERROR_CODES.DUPLICATE_ENTRY, 409);
  }

  // Check if employeeId already exists
  if (employeeId) {
    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      throw createError('Employee ID is already in use', ERROR_CODES.DUPLICATE_ENTRY, 409);
    }
  }

  // Generate employee ID if not provided
  const finalEmployeeId = employeeId || await generateEmployeeId();

  // Public signup is always an employee. Admins are created via seed or HR.
  const userRole = 'employee';

  const employee = new Employee({
    employeeId: finalEmployeeId,
    firstName: firstName || email.split('@')[0],
    lastName: lastName?.trim() ? lastName.trim() : '-',
    email,
    phone: phone || '',
    department: department || 'General',
    designation: designation || 'Employee',
    employmentStatus: 'active',
    joiningDate: new Date(),
    profilePicture: data.profilePicture || ''
  });

  // Create user account
  const user = new User({
    email,
    password,
    role: userRole,
    employee: employee._id,
    isFirstLogin: false,
    isActive: true
  });

  employee.user = user._id;

  await employee.save();
  await user.save();

  const leaveTypes = await LeaveType.find({ isActive: true });
  const currentYear = new Date().getFullYear();
  if (leaveTypes.length > 0) {
    await LeaveBalance.insertMany(leaveTypes.map(lt => ({
      employee: employee._id,
      leaveType: lt._id,
      totalDays: lt.defaultDays,
      year: currentYear
    })));
  }

  // Create welcome notification
  await createNotification({
    recipientId: user._id,
    type: 'employee_created',
    title: 'Welcome to Dayflow!',
    message: `Your account has been created successfully. Employee ID: ${finalEmployeeId}`,
    metadata: { entityType: 'Employee', entityId: employee._id }
  });

  // Audit log
  await createAuditLog({
    actorId: user._id,
    action: 'ACCOUNT_SIGNUP',
    entityType: 'User',
    entityId: user._id,
    newValue: { email, role: userRole, employeeId: finalEmployeeId }
  });

  // Generate token for auto-login
  const token = generateToken({ userId: user._id, role: userRole, employeeId: finalEmployeeId });

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      isFirstLogin: false,
      employee
    }
  };
};

export const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+password').populate('employee');
  if (!user) {
    throw createError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS, 401);
  }
  
  if (!user.isActive) {
    throw createError('Account is inactive', ERROR_CODES.INACTIVE_ACCOUNT, 403);
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS, 401);
  }
  
  const employeeIdStr = user.employee ? user.employee.employeeId : null;
  const token = generateToken({ userId: user._id, role: user.role, employeeId: employeeIdStr });
  
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      employee: user.employee
    }
  };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw createError('User not found', ERROR_CODES.NOT_FOUND, 404);
  }
  
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw createError('Current password is incorrect', ERROR_CODES.PASSWORD_MISMATCH, 400);
  }
  
  user.password = newPassword;
  user.isFirstLogin = false;
  await user.save();
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    return {};
  }
  
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  await user.save();
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Reset token for ${email}: ${resetToken}`);
    return { resetToken };
  }

  return {};
};

export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw createError('Token is invalid or has expired', ERROR_CODES.INVALID_RESET_TOKEN, 400);
  }
  
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.isFirstLogin = false;
  await user.save();
};
