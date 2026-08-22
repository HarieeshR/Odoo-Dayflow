import api from './api';

export const getAttendanceReport = async (params) => {
  const response = await api.get('/reports/attendance', { params });
  return response.data;
};

export const getLeaveReport = async (params) => {
  const response = await api.get('/reports/leave', { params });
  return response.data;
};

export const getPayrollReport = async (params) => {
  const response = await api.get('/reports/payroll', { params });
  return response.data;
};
