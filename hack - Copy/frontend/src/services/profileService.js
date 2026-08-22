import api from './api';

export const getMyProfile = async () => {
  const response = await api.get('/profile/me');
  return response.data;
};

export const updateMyProfile = async (data) => {
  // If data is FormData (has file), send as multipart; otherwise JSON
  if (data instanceof FormData) {
    const response = await api.put('/profile/me', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await api.put('/profile/me', data);
  return response.data;
};
