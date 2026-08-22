import Employee from '../models/Employee.js';

export const generateEmployeeId = async () => {
  const latestEmployee = await Employee.findOne({ employeeId: /^EMP-\d+$/ }).sort({ employeeId: -1 });
  if (!latestEmployee || !latestEmployee.employeeId) {
    return 'EMP-0001';
  }
  
  const currentId = latestEmployee.employeeId;
  const parts = currentId.split('-');
  const num = parseInt(parts[1], 10);
  
  if (isNaN(num)) return 'EMP-0001';
  
  const nextNum = num + 1;
  return `EMP-${nextNum.toString().padStart(4, '0')}`;
};
