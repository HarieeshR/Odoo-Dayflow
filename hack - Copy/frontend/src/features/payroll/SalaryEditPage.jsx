import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import * as salaryService from '../../services/salaryService';
import * as employeeService from '../../services/employeeService';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import Table from '../../components/ui/Table';

const SalaryEditPage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [monthlyWage, setMonthlyWage] = useState(0);
  const [components, setComponents] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [changeReason, setChangeReason] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await employeeService.getEmployee(employeeId);
        if (empRes.success) setEmployee(empRes.data);

        try {
          const salRes = await salaryService.getEmployeeSalary(employeeId);
          if (salRes.success && salRes.data) {
            setMonthlyWage(salRes.data.monthlyWage || 0);
            setComponents(salRes.data.components || []);
            setDeductions(salRes.data.deductions || []);
            if (salRes.data.effectiveDate) {
              setEffectiveDate(format(new Date(salRes.data.effectiveDate), 'yyyy-MM-dd'));
            }
          }
        } catch (e) {
          // Defaults if no salary config exists
          setComponents([
            { name: 'Basic', type: 'percentage', value: 50, baseComponent: 'monthlyWage' },
            { name: 'HRA', type: 'percentage', value: 50, baseComponent: 'Basic' },
            { name: 'Standard Allowance', type: 'fixed', value: 2000 }
          ]);
          setDeductions([
            { name: 'Provident Fund', type: 'percentage', value: 12 }
          ]);
        }

        try {
          const histRes = await salaryService.getSalaryHistory(employeeId);
          if (histRes.success) setHistory(Array.isArray(histRes.data) ? histRes.data : (histRes.data?.records || []));
        } catch (e) {}

      } catch (err) {
        toast.error('Failed to load employee details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId]);

  const addComponent = () => {
    setComponents([...components, { name: '', type: 'fixed', value: 0, baseComponent: '' }]);
  };
  const updateComponent = (index, field, val) => {
    const newComps = [...components];
    newComps[index][field] = val;
    setComponents(newComps);
  };
  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const addDeduction = () => {
    setDeductions([...deductions, { name: '', type: 'fixed', value: 0 }]);
  };
  const updateDeduction = (index, field, val) => {
    const newDeds = [...deductions];
    newDeds[index][field] = val;
    setDeductions(newDeds);
  };
  const removeDeduction = (index) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!monthlyWage || monthlyWage <= 0) {
      toast.error('Please enter a valid monthly wage');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        monthlyWage: Number(monthlyWage),
        components: components.map(c => ({
          ...c, 
          value: Number(c.value),
          baseComponent: c.type === 'percentage' ? c.baseComponent : undefined
        })),
        deductions: deductions.map(d => ({
          ...d,
          value: Number(d.value)
        })),
        effectiveDate,
        changeReason
      };
      
      const res = await salaryService.updateEmployeeSalary(employeeId, payload);
      if (res.success) {
        toast.success('Salary updated successfully');
        navigate('/admin/payroll');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update salary');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12"><LoadingSpinner size="lg" /></div>;
  if (!employee) return <ErrorState message="Employee not found" />;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/payroll')}>
          <HiOutlineArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configure Salary</h1>
          <p className="text-gray-500">
            {employee.firstName} {employee.lastName} • {employee.employeeId} • {employee.department}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card title="Base Configuration">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              type="number" 
              label="Monthly Wage (₹)" 
              value={monthlyWage}
              onChange={(e) => setMonthlyWage(e.target.value)}
              required
            />
            <Input 
              type="date" 
              label="Effective Date" 
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
          </div>
        </Card>

        <Card title="Earnings Components">
          <div className="space-y-4">
            {components.map((comp, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="w-full md:w-1/4">
                  <Input label="Component Name" value={comp.name} onChange={e => updateComponent(idx, 'name', e.target.value)} required />
                </div>
                <div className="w-full md:w-1/4">
                  <Select 
                    label="Type" 
                    value={comp.type} 
                    onChange={e => updateComponent(idx, 'type', e.target.value)}
                    options={[
                      { label: 'Percentage (%)', value: 'percentage' },
                      { label: 'Fixed Amount (₹)', value: 'fixed' }
                    ]}
                  />
                </div>
                {comp.type === 'percentage' && (
                  <div className="w-full md:w-1/4">
                    <Select 
                      label="Base Component" 
                      value={comp.baseComponent} 
                      onChange={e => updateComponent(idx, 'baseComponent', e.target.value)}
                      options={[
                        { label: 'Monthly Wage', value: 'monthlyWage' },
                        ...components.slice(0, idx).map(c => ({ label: c.name, value: c.name }))
                      ]}
                      required
                    />
                  </div>
                )}
                <div className="w-full md:w-1/4">
                  <Input 
                    type="number" 
                    label={comp.type === 'percentage' ? 'Value (%)' : 'Amount (₹)'} 
                    value={comp.value} 
                    onChange={e => updateComponent(idx, 'value', e.target.value)} 
                    required 
                  />
                </div>
                <Button type="button" variant="ghost" className="text-danger-500 hover:bg-danger-50" onClick={() => removeComponent(idx)}>
                  <HiOutlineTrash className="h-5 w-5" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" icon={HiOutlinePlus} onClick={addComponent}>
              Add Component
            </Button>
          </div>
        </Card>

        <Card title="Deductions">
          <div className="space-y-4">
            {deductions.map((ded, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="w-full md:w-1/3">
                  <Input label="Deduction Name" value={ded.name} onChange={e => updateDeduction(idx, 'name', e.target.value)} required />
                </div>
                <div className="w-full md:w-1/3">
                  <Select 
                    label="Type" 
                    value={ded.type} 
                    onChange={e => updateDeduction(idx, 'type', e.target.value)}
                    options={[
                      { label: 'Percentage of Basic', value: 'percentage' },
                      { label: 'Fixed Amount (₹)', value: 'fixed' }
                    ]}
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <Input 
                    type="number" 
                    label={ded.type === 'percentage' ? 'Value (%)' : 'Amount (₹)'} 
                    value={ded.value} 
                    onChange={e => updateDeduction(idx, 'value', e.target.value)} 
                    required 
                  />
                </div>
                <Button type="button" variant="ghost" className="text-danger-500 hover:bg-danger-50" onClick={() => removeDeduction(idx)}>
                  <HiOutlineTrash className="h-5 w-5" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" icon={HiOutlinePlus} onClick={addDeduction}>
              Add Deduction
            </Button>
          </div>
        </Card>
        
        <Card>
          <div className="mb-4">
            <Input label="Reason for Change (Optional)" value={changeReason} onChange={e => setChangeReason(e.target.value)} placeholder="e.g. Annual Appraisal 2026" />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/payroll')} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Salary Structure</Button>
          </div>
        </Card>
      </form>

      {history.length > 0 && (
        <Card title="Salary History">
          <Table 
            columns={[
              { key: 'effectiveDate', label: 'Effective Date', render: (v) => v ? format(new Date(v), 'MMM d, yyyy') : '-' },
              { key: 'monthlyWage', label: 'Monthly Wage', render: (v) => formatCurrency(v) },
              { key: 'netSalary', label: 'Net Salary', render: (v) => formatCurrency(v) },
              { key: 'reason', label: 'Reason', render: (v) => v || '-' },
              { key: 'updatedAt', label: 'Updated On', render: (v) => v ? format(new Date(v), 'MMM d, yyyy HH:mm') : '-' }
            ]}
            data={history}
          />
        </Card>
      )}
    </div>
  );
};

export default SalaryEditPage;
