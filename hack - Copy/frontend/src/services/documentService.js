import api from './api';

export const uploadDocument = async (formData) => {
  const response = await api.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMyDocuments = async (params) => {
  const response = await api.get('/documents/me', { params });
  return response.data;
};

export const getAllDocuments = async (params) => {
  const response = await api.get('/documents', { params });
  return response.data;
};

export const downloadDocument = async (id) => {
  const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};
