import Employee from '../models/Employee.js';
import User from '../models/User.js';
import LeaveType from '../models/LeaveType.js';
import LeaveBalance from '../models/LeaveBalance.js';
import { generateEmployeeId } from '../utils/generateEmployeeId.js';
import { createNotification } from './notification.service.js';
import { createAuditLog } from './audit.service.js';
import { applyEmployeeUpdates } from '../utils/employeeUpdates.js';
import { ROLES } from '../constants/roles.js';

export const createEmployee = async (data, actorId) => {
  const existingUser = await User.findOne({ email: data.email });
  const existingEmployee = await Employee.findOne({ email: data.email });

  if (existingUser || existingEmployee) {
    const error = new Error('Email is already registered');
    error.statusCode = 400;
    throw error;
  }

  const employeeId = await generateEmployeeId();
  
  const employee = new Employee({
    ...data,
    employeeId
  });

  const temporaryPassword = `Dayflow@${employeeId}`;

  const user = new User({
    email: data.email,
    password: temporaryPassword,
    role: ROLES.EMPLOYEE,
    employee: employee._id,
    isFirstLogin: true
  });

  employee.user = user._id;

  await employee.save();
  await user.save();

  const leaveTypes = await LeaveType.find({ isActive: true });
  const currentYear = new Date().getFullYear();
  const balances = leaveTypes.map(lt => ({
    employee: employee._id,
    leaveType: lt._id,
    totalDays: lt.defaultDays,
    year: currentYear
  }));
  if (balances.length > 0) {
    await LeaveBalance.insertMany(balances);
  }
  
  await createNotification({
    recipientId: user._id,
    type: 'employee_created',
    title: 'Welcome to Dayflow!',
    message: `Your employee profile has been created with ID: ${employeeId}. Please reset your password on first login.`,
    metadata: { entityType: 'Employee', entityId: employee._id }
  });

  await createAuditLog({
    actorId,
    action: 'EMPLOYEE_CREATED',
    entityType: 'Employee',
    entityId: employee._id,
    newValue: employee.toObject()
  });

  return { employee, temporaryPassword };
};

export const listEmployees = async ({ page = 1, limit = 10, search, department, status, sort }) => {
  const filter = {};

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { employeeId: searchRegex }
    ];
  }

  if (department) filter.department = department;
  if (status) filter.employmentStatus = status;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;
  const sortOptions = sort || { createdAt: -1 };

  const employees = await Employee.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .populate('manager', 'firstName lastName email employeeId')
    .populate('user', 'email role isActive isFirstLogin');

  const total = await Employee.countDocuments(filter);

  return {
    employees,
    records: employees,
    total,
    totalPages: Math.ceil(total / limitNum),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const getEmployee = async (id) => {
  const employee = await Employee.findById(id)
    .populate('manager', 'firstName lastName email employeeId')
    .populate('user', 'email role isActive isFirstLogin');

  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }
  return employee;
};

export const updateEmployee = async (id, data, actorId) => {
  const employee = await Employee.findById(id);

  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }

  if (data.email && data.email !== employee.email) {
    const existing = await Employee.findOne({ email: data.email });
    if (existing) {
      const error = new Error('Email is already in use by another employee');
      error.statusCode = 400;
      throw error;
    }
    await User.findByIdAndUpdate(employee.user, { email: data.email });
  }

  const oldValue = employee.toObject();
  applyEmployeeUpdates(employee, data);
  await employee.save();

  await createAuditLog({
    actorId,
    action: 'EMPLOYEE_UPDATED',
    entityType: 'Employee',
    entityId: employee._id,
    oldValue,
    newValue: employee.toObject()
  });

  return employee;
};

export const updateStatus = async (id, status, actorId) => {
  const employee = await Employee.findById(id).populate('user');

  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }

  const oldStatus = employee.employmentStatus;
  employee.employmentStatus = status;
  
  if (employee.user) {
    employee.user.isActive = status === 'active';
    await employee.user.save();
  }

  await employee.save();

  if (employee.user) {
    await createNotification({
      recipientId: employee.user._id,
      type: 'status_changed',
      title: 'Employment Status Updated',
      message: `Your employment status has been updated to ${status}.`,
      metadata: { entityType: 'Employee', entityId: employee._id }
    });
  }

  await createAuditLog({
    actorId,
    action: 'EMPLOYEE_STATUS_CHANGED',
    entityType: 'Employee',
    entityId: employee._id,
    oldValue: { employmentStatus: oldStatus },
    newValue: { employmentStatus: status }
  });

  return employee;
};

export const resetCredentials = async (id, actorId) => {
  const employee = await Employee.findById(id).populate('user');

  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }

  const temporaryPassword = `Dayflow@${employee.employeeId}`;
  
  if (employee.user) {
    employee.user.password = temporaryPassword;
    employee.user.isFirstLogin = true;
    await employee.user.save();
  }

  if (employee.user) {
    await createNotification({
      recipientId: employee.user._id,
      type: 'password_changed',
      title: 'Credentials Reset',
      message: 'Your account credentials have been reset by an administrator.',
      metadata: { entityType: 'User', entityId: employee.user._id }
    });
  }

  await createAuditLog({
    actorId,
    action: 'CREDENTIALS_RESET',
    entityType: 'User',
    entityId: employee.user._id,
    oldValue: null,
    newValue: null
  });

  return { temporaryPassword };
};
