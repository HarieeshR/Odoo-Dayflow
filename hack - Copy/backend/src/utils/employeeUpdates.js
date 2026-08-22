import { config } from '../config/index.js';

export const publicMediaUrl = (filePath) => {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const origin = (config.backendUrl || `http://localhost:${config.port || 5000}`).replace(/\/$/, '');
  const normalized = String(filePath).replace(/\\/g, '/').replace(/^\//, '');
  return `${origin}/${normalized}`;
};

const parseMaybeJson = (value) => {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const emptyToUndefined = (value) => {
  if (value === '' || value === null) return undefined;
  return value;
};

export const applyEmployeeUpdates = (employee, data = {}) => {
  const payload = { ...data };

  if (payload.profilePhoto && !payload.profilePicture) {
    payload.profilePicture = payload.profilePhoto;
  }

  const address = parseMaybeJson(payload.address);
  if (address && typeof address === 'object') {
    employee.address = { ...(employee.address?.toObject?.() || employee.address || {}), ...address };
  }

  const incomingBank = parseMaybeJson(payload.bankDetails) || {};
  const bankPatch = {
    ...(typeof incomingBank === 'object' ? incomingBank : {}),
    ...(payload.bankName !== undefined ? { bankName: payload.bankName } : {}),
    ...(payload.accountNumber !== undefined ? { accountNumber: payload.accountNumber } : {}),
    ...(payload.ifsc !== undefined ? { ifsc: payload.ifsc } : {})
  };
  if (Object.keys(bankPatch).length > 0) {
    employee.bankDetails = { ...(employee.bankDetails?.toObject?.() || employee.bankDetails || {}), ...bankPatch };
  }

  const incomingStatutory = parseMaybeJson(payload.statutory) || {};
  const statutoryPatch = {
    ...(typeof incomingStatutory === 'object' ? incomingStatutory : {}),
    ...(payload.pan !== undefined ? { pan: payload.pan } : {}),
    ...(payload.uan !== undefined ? { uan: payload.uan } : {}),
    ...(payload.employeeCode !== undefined ? { employeeCode: payload.employeeCode } : {})
  };
  if (Object.keys(statutoryPatch).length > 0) {
    employee.statutory = { ...(employee.statutory?.toObject?.() || employee.statutory || {}), ...statutoryPatch };
  }

  const scalarFields = [
    'firstName', 'lastName', 'email', 'phone', 'profilePicture', 'department', 'designation',
    'location', 'joiningDate', 'employmentStatus', 'dateOfBirth', 'nationality', 'personalEmail',
    'gender', 'maritalStatus', 'aboutMe'
  ];

  for (const field of scalarFields) {
    if (payload[field] === undefined) continue;
    const value = emptyToUndefined(payload[field]);
    if (value === undefined) continue;
    employee[field] = value;
  }

  if (payload.status && !payload.employmentStatus) {
    employee.employmentStatus = payload.status;
  }

  if (payload.manager) {
    employee.manager = payload.manager._id || payload.manager;
  }

  return employee;
};
