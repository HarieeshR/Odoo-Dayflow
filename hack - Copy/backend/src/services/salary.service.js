import SalaryStructure from '../models/SalaryStructure.js';
import SalaryHistory from '../models/SalaryHistory.js';
import Employee from '../models/Employee.js';
import * as auditService from './audit.service.js';
import * as notificationService from './notification.service.js';
import { idOf } from '../utils/dates.js';

export const calculateComponents = (monthlyWage, components) => {
  let totalEarnings = 0;
  const calculatedComponents = [];
  const map = new Map();

  for (const comp of components) {
    let calculatedAmount = 0;
    if (comp.type === 'fixed') {
      calculatedAmount = comp.value;
    } else if (comp.type === 'percentage') {
      const base = comp.baseComponent || 'monthlyWage';
      if (base === 'monthlyWage') {
        calculatedAmount = (comp.value / 100) * monthlyWage;
      } else {
        const baseAmount = map.get(base) || 0;
        calculatedAmount = (comp.value / 100) * baseAmount;
      }
    }
    
    // Round to 2 decimals
    calculatedAmount = Math.round(calculatedAmount * 100) / 100;
    
    map.set(comp.name, calculatedAmount);
    totalEarnings += calculatedAmount;

    calculatedComponents.push({
      ...comp,
      calculatedAmount
    });
  }

  return { components: calculatedComponents, totalEarnings };
};

export const calculateDeductions = (totalEarnings, deductions) => {
  let totalDeductions = 0;
  const calculatedDeductions = [];

  for (const ded of deductions) {
    let calculatedAmount = 0;
    if (ded.type === 'fixed') {
      calculatedAmount = ded.value;
    } else if (ded.type === 'percentage') {
      // Assuming baseComponent defaults to 'totalEarnings'
      calculatedAmount = (ded.value / 100) * totalEarnings;
    }
    
    calculatedAmount = Math.round(calculatedAmount * 100) / 100;
    totalDeductions += calculatedAmount;

    calculatedDeductions.push({
      ...ded,
      calculatedAmount
    });
  }

  return { deductions: calculatedDeductions, totalDeductions };
};

export const getMySalary = async (employeeId) => {
  return SalaryStructure.findOne({ employee: idOf(employeeId) }).populate('employee', 'firstName lastName employeeId department designation');
};

export const getEmployeeSalary = async (employeeId) => {
  return SalaryStructure.findOne({ employee: idOf(employeeId) }).populate('employee');
};

export const updateSalary = async (employeeId, data, adminUserId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw new Error('Employee not found');

  const { components, totalEarnings } = calculateComponents(data.monthlyWage, data.components);
  const { deductions, totalDeductions } = calculateDeductions(totalEarnings, data.deductions);
  const netSalary = Math.round((totalEarnings - totalDeductions) * 100) / 100;

  const existing = await SalaryStructure.findOne({ employee: employeeId });
  let oldData = null;

  if (existing) {
    oldData = existing.toObject();
    await SalaryHistory.create({
      employee: employeeId,
      effectiveDate: existing.effectiveDate,
      monthlyWage: existing.monthlyWage,
      components: existing.components,
      deductions: existing.deductions,
      totalEarnings: existing.totalEarnings,
      totalDeductions: existing.totalDeductions,
      netSalary: existing.netSalary,
      updatedBy: existing.updatedBy,
      changeReason: data.changeReason || 'Update'
    });
  }

  const newStructureData = {
    employee: employeeId,
    monthlyWage: data.monthlyWage,
    components,
    deductions,
    totalEarnings,
    totalDeductions,
    netSalary,
    effectiveDate: new Date(data.effectiveDate),
    updatedBy: adminUserId
  };

  const updatedStructure = await SalaryStructure.findOneAndUpdate(
    { employee: employeeId },
    newStructureData,
    { new: true, upsert: true }
  );

  if (employee.user) {
    await notificationService.createNotification({
      recipientId: employee.user,
      title: 'Salary Updated',
      message: 'Your salary structure has been updated.',
      type: 'salary_changed'
    });
  }

  await auditService.createAuditLog({
    actorId: adminUserId,
    action: 'SALARY_UPDATE',
    entityType: 'SalaryStructure',
    entityId: updatedStructure._id,
    newValue: { newTotalEarnings: totalEarnings }
  });

  return updatedStructure;
};

export const getSalaryHistory = async (employeeId) => {
  return SalaryHistory.find({ employee: employeeId }).sort({ effectiveDate: -1 }).populate('updatedBy', 'firstName lastName email');
};
