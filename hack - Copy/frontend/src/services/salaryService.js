import api from './api';

export const getMySalary = async () => {
  const response = await api.get('/salary/me');
  return response.data;
};

export const getEmployeeSalary = async (employeeId) => {
  const response = await api.get(`/salary/employees/${employeeId}`);
  return response.data;
};

export const updateEmployeeSalary = async (employeeId, data) => {
  const response = await api.put(`/salary/employees/${employeeId}`, data);
  return response.data;
};

export const getSalaryHistory = async (employeeId) => {
  const response = await api.get(`/salary/history/${employeeId}`);
  return response.data;
};
