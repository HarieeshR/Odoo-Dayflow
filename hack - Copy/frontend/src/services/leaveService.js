import api from './api';

export const createLeaveRequest = async (data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const response = await api.post('/leaves', data, isFormData ? {
    headers: { 'Content-Type': 'multipart/form-data' }
  } : undefined);
  return response.data;
};

export const getMyLeaveRequests = async (params) => {
  const response = await api.get('/leaves/me', { params });
  return response.data;
};

export const getMyLeaveBalance = async () => {
  const response = await api.get('/leaves/balance/me');
  return response.data;
};

export const getAllLeaveRequests = async (params) => {
  const response = await api.get('/leaves', { params });
  return response.data;
};

export const approveLeave = async (id, comments) => {
  const response = await api.patch(`/leaves/${id}/approve`, { comments });
  return response.data;
};

export const rejectLeave = async (id, comments) => {
  const response = await api.patch(`/leaves/${id}/reject`, { comments });
  return response.data;
};

export const getAllLeaveBalances = async (params) => {
  const response = await api.get('/leaves/balance', { params });
  return response.data;
};

export const adjustLeaveBalance = async (employeeId, data) => {
  const response = await api.put(`/leaves/balance/${employeeId}`, data);
  return response.data;
};
