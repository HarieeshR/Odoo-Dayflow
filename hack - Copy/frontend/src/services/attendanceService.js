import api from './api';

export const checkIn = async () => {
  const response = await api.post('/attendance/check-in');
  return response.data;
};

export const checkOut = async () => {
  const response = await api.post('/attendance/check-out');
  return response.data;
};

export const getMyAttendance = async (params) => {
  const response = await api.get('/attendance/me', { params });
  return response.data;
};

export const getAllAttendance = async (params) => {
  const response = await api.get('/attendance', { params });
  return response.data;
};

export const getAttendanceReports = async (params) => {
  const response = await api.get('/attendance/reports', { params });
  return response.data;
};
