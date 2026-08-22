import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HiOutlineSearch, HiOutlinePencilAlt, HiOutlineCurrencyRupee } from 'react-icons/hi';
import * as employeeService from '../../services/employeeService';
import { listItems, listTotal } from '../../utils/response';
import useDebounce from '../../hooks/useDebounce';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';

const AdminPayrollPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [department, setDepartment] = useState('');
  
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getEmployees({
        page,
        limit,
        search: debouncedSearch,
        department,
        status: 'active'
      });
      if (response.success) {
        setEmployees(response.data.employees || listItems(response.data));
        setTotal(listTotal(response.data));
      }
    } catch (err) {
      toast.error('Failed to load employees for payroll');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, department]);

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (_, row) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold mr-3">
            {row.firstName?.charAt(0)}{row.lastName?.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.firstName} {row.lastName}</div>
            <div className="text-gray-500 text-xs">{row.employeeId} • {row.department}</div>
          </div>
        </div>
      )
    },
    {
      key: 'designation',
      label: 'Designation'
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">Active</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/admin/payroll/${row._id}/edit`)}
          icon={HiOutlineCurrencyRupee}
        >
          Configure Salary
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              icon={HiOutlineSearch}
              placeholder="Search employee name or ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              options={[
                { label: 'All Departments', value: '' },
                { label: 'Engineering', value: 'Engineering' },
                { label: 'HR', value: 'HR' },
                { label: 'Finance', value: 'Finance' },
                { label: 'Marketing', value: 'Marketing' },
                { label: 'Sales', value: 'Sales' },
                { label: 'Operations', value: 'Operations' }
              ]}
            />
          </div>
        </div>

        <Table 
          columns={columns} 
          data={employees} 
          loading={loading}
          emptyMessage="No active employees found."
        />

        {!loading && total > 0 && (
          <Pagination 
            currentPage={page} 
            totalPages={Math.ceil(total / limit)} 
            onPageChange={setPage} 
          />
        )}
      </Card>
    </div>
  );
};

export default AdminPayrollPage;
