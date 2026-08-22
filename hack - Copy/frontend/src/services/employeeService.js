import api from './api';

export const getEmployees = async (params) => {
  const response = await api.get('/employees', { params });
  return response.data;
};

export const createEmployee = async (data) => {
  const response = await api.post('/employees', data);
  return response.data;
};

export const getEmployee = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const updateEmployee = async (id, data) => {
  const response = await api.put(`/employees/${id}`, data);
  return response.data;
};

export const updateEmployeeStatus = async (id, status) => {
  const response = await api.patch(`/employees/${id}/status`, { status });
  return response.data;
};

export const resetCredentials = async (id) => {
  const response = await api.post(`/employees/${id}/reset-credentials`);
  return response.data;
};

export const uploadProfilePicture = async (id, formData) => {
  const response = await api.post(`/employees/${id}/profile-picture`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
