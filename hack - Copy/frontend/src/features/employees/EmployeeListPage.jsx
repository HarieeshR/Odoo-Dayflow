import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { HiPlus, HiOutlineSearch, HiOutlinePencilAlt, HiOutlineEye, HiOutlineMail, HiOutlineOfficeBuilding } from 'react-icons/hi';
import * as employeeService from '../../services/employeeService';
import { listItems, listTotal } from '../../utils/response';
import useDebounce from '../../hooks/useDebounce';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const EmployeeListPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  
  const [page, setPage] = useState(1);
  const limit = 12;

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getEmployees({
        page, limit,
        search: debouncedSearch,
        department, status
      });
      if (response.success) {
        const items = listItems(response.data);
        setEmployees(items.length ? items : (response.data.employees || []));
        setTotal(listTotal(response.data));
      }
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, department, status]);

  const totalPages = Math.ceil(total / limit);

  const EmployeeCard = ({ emp }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0">
            {emp.profilePhotoUrl ? (
              <img src={emp.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <>{emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}</>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{emp.firstName} {emp.lastName}</h3>
            <p className="text-xs text-gray-500 truncate">{emp.designation || 'No designation'}</p>
          </div>
        </div>
        <Badge variant={emp.employmentStatus === 'active' || emp.status === 'active' ? 'success' : 'danger'} size="sm">
          {(emp.employmentStatus || emp.status || 'N/A').charAt(0).toUpperCase() + (emp.employmentStatus || emp.status || 'N/A').slice(1)}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-xs text-gray-500">
          <HiOutlineMail className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
          <span className="truncate">{emp.email}</span>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <HiOutlineOfficeBuilding className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
          <span>{emp.department || '-'}</span>
        </div>
        <div className="flex items-center text-xs text-gray-400">
          <span className="font-mono">{emp.employeeId}</span>
          <span className="mx-2">•</span>
          <span>Joined {emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM yyyy') : '-'}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <Button 
          variant="outline" size="sm" className="flex-1"
          onClick={() => navigate(`/admin/employees/${emp._id}`)}
        >
          <HiOutlineEye className="h-3.5 w-3.5 mr-1" /> View
        </Button>
        <Button 
          variant="outline" size="sm" className="flex-1"
          onClick={() => navigate(`/admin/employees/${emp._id}/edit`)}
        >
          <HiOutlinePencilAlt className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total employees</p>
        </div>
        <Button 
          icon={HiPlus} 
          onClick={() => navigate('/admin/employees/create')}
        >
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            icon={HiOutlineSearch}
            placeholder="Search name, email, ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full md:w-48">
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
        <div className="w-full md:w-48">
          <Select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' }
            ]}
          />
        </div>
      </div>

      {/* Employee Cards */}
      {loading ? (
        <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>
      ) : employees.length === 0 ? (
        <EmptyState message="No employees found matching the filters." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map(emp => (
            <EmployeeCard key={emp._id} emp={emp} />
          ))}
        </div>
      )}

      {!loading && total > 0 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}
    </div>
  );
};

export default EmployeeListPage;
