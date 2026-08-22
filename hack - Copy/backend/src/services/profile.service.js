import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { createAuditLog } from './audit.service.js';
import { ROLES } from '../constants/roles.js';
import { applyEmployeeUpdates } from '../utils/employeeUpdates.js';

export const getMyProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  let employee = await Employee.findOne({ user: userId })
    .populate('manager', 'firstName lastName email employeeId')
    .populate('user', 'email role isActive isFirstLogin');

  if (!employee && user.employee) {
    employee = await Employee.findById(user.employee)
      .populate('manager', 'firstName lastName email employeeId')
      .populate('user', 'email role isActive isFirstLogin');
  }

  if (!employee) {
    const error = new Error('Employee profile is not linked to this account');
    error.statusCode = 404;
    throw error;
  }

  return employee;
};

export const updateMyProfile = async (user, data) => {
  const employee = await Employee.findOne({ user: user._id }) || await Employee.findById(user.employee);

  if (!employee) {
    const error = new Error('Profile not found');
    error.statusCode = 404;
    throw error;
  }

  const oldValue = employee.toObject();

  if (user.role === ROLES.ADMIN) {
    applyEmployeeUpdates(employee, data);
  } else {
    const allowed = {};
    const allowedFields = [
      'phone', 'personalEmail', 'address', 'nationality', 'gender', 'maritalStatus',
      'dateOfBirth', 'profilePicture', 'profilePhoto', 'aboutMe', 'bankDetails',
      'bankName', 'accountNumber', 'ifsc'
    ];
    for (const field of allowedFields) {
      if (data[field] !== undefined) allowed[field] = data[field];
    }
    applyEmployeeUpdates(employee, allowed);
  }

  await employee.save();

  await createAuditLog({
    actorId: user._id,
    action: 'PROFILE_UPDATED',
    entityType: 'Employee',
    entityId: employee._id,
    oldValue,
    newValue: employee.toObject()
  });

  return employee;
};
