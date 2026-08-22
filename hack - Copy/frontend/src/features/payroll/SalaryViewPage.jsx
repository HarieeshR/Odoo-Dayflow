import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { HiOutlineCurrencyRupee, HiOutlineInformationCircle } from 'react-icons/hi';
import * as salaryService from '../../services/salaryService';

import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';

const SalaryViewPage = () => {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const response = await salaryService.getMySalary();
        if (response.success && response.data) {
          setSalary(response.data);
        } else {
          setSalary(null);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setSalary(null);
        } else {
          setError('Failed to fetch salary structure');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSalary();
  }, []);

  if (loading) return <div className="p-12"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  
  if (!salary || !salary.monthlyWage) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <EmptyState 
          icon={HiOutlineCurrencyRupee}
          title="Salary Structure Not Configured" 
          description="Your salary details have not been configured yet. Please contact HR." 
        />
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">My Salary</h1>

      <Card className="bg-gradient-to-r from-primary-600 to-primary-800 text-white border-0 shadow-lg">
        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-primary-100 font-medium">Net Salary (Monthly)</p>
            <h2 className="text-4xl md:text-5xl font-bold mt-2">{formatCurrency(salary.netSalary)}</h2>
            <p className="text-sm text-primary-200 mt-4">
              Effective Date: {salary.effectiveDate ? format(new Date(salary.effectiveDate), 'MMMM d, yyyy') : 'N/A'}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm w-full md:w-auto min-w-[250px]">
            <div className="flex justify-between items-center mb-3 border-b border-white/20 pb-2">
              <span className="text-primary-100">Monthly Wage</span>
              <span className="font-semibold">{formatCurrency(salary.monthlyWage)}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-primary-100">Total Earnings</span>
              <span className="font-semibold">{formatCurrency(salary.totalEarnings)}</span>
            </div>
            <div className="flex justify-between items-center text-danger-200">
              <span>Total Deductions</span>
              <span className="font-semibold">-{formatCurrency(salary.totalDeductions)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Earnings Breakdown">
          <div className="mt-4">
            <ul className="divide-y divide-gray-100">
              {salary.components?.map((comp, idx) => (
                <li key={idx} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{comp.name}</p>
                    <p className="text-sm text-gray-500">
                      {comp.type === 'percentage' 
                        ? `${comp.value}% of ${comp.baseComponent}`
                        : 'Fixed Amount'}
                    </p>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(comp.calculatedAmount)}
                  </div>
                </li>
              ))}
              {(!salary.components || salary.components.length === 0) && (
                <li className="py-4 text-center text-gray-500">No components defined</li>
              )}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-900">Total Earnings</span>
              <span className="font-bold text-success-600">{formatCurrency(salary.totalEarnings)}</span>
            </div>
          </div>
        </Card>

        <Card title="Deductions">
          <div className="mt-4">
            <ul className="divide-y divide-gray-100">
              {salary.deductions?.map((ded, idx) => (
                <li key={idx} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{ded.name}</p>
                    <p className="text-sm text-gray-500">
                      {ded.type === 'percentage' 
                        ? `${ded.value}%`
                        : 'Fixed Amount'}
                    </p>
                  </div>
                  <div className="font-semibold text-danger-600">
                    -{formatCurrency(ded.calculatedAmount)}
                  </div>
                </li>
              ))}
              {(!salary.deductions || salary.deductions.length === 0) && (
                <li className="py-4 text-center text-gray-500">No deductions defined</li>
              )}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-900">Total Deductions</span>
              <span className="font-bold text-danger-600">-{formatCurrency(salary.totalDeductions)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-start p-4 bg-primary-50 rounded-lg">
        <HiOutlineInformationCircle className="h-5 w-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
        <p className="text-sm text-primary-700">
          This shows your current active salary structure. Values shown are gross monthly amounts before taxes and other variable deductions.
        </p>
      </div>
    </div>
  );
};

export default SalaryViewPage;
