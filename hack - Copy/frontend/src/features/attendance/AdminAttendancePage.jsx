import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { HiOutlineSearch, HiOutlineDocumentReport, HiOutlineChartPie, HiOutlineClock } from 'react-icons/hi';
import * as attendanceService from '../../services/attendanceService';
import { listItems, listTotal } from '../../utils/response';
import useDebounce from '../../hooks/useDebounce';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';

const AdminAttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await attendanceService.getAllAttendance({
        search: debouncedSearch,
        department,
        status,
        startDate,
        endDate,
        page,
        limit
      });
      if (response.success) {
        setRecords(listItems(response.data));
        setTotal(listTotal(response.data));
      }
    } catch (err) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await attendanceService.getAttendanceReports({
        startDate,
        endDate,
        department
      });
      if (res.success) {
        setReports(res.data);
      }
    } catch (err) {
      // silently fail
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, department, status, startDate, endDate]);

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (_, row) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold mr-3">
            {row.employee?.firstName?.charAt(0)}{row.employee?.lastName?.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.employee?.firstName} {row.employee?.lastName}</div>
            <div className="text-gray-500 text-xs">{row.employee?.employeeId} • {row.employee?.department}</div>
          </div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => val ? format(new Date(val), 'MMM d, yyyy') : '-'
    },
    {
      key: 'checkIn',
      label: 'Check In',
      render: (val) => val ? format(new Date(val), 'h:mm a') : '-'
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      render: (val) => val ? format(new Date(val), 'h:mm a') : '-'
    },
    {
      key: 'workHours',
      label: 'Work Hrs',
      render: (val) => val ? `${val.toFixed(2)}h` : '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const variants = {
          present: 'success',
          absent: 'danger',
          half_day: 'warning',
          leave: 'info'
        };
        return <Badge variant={variants[val] || 'neutral'}>{val?.replace('_', ' ').toUpperCase()}</Badge>;
      }
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>

      {/* Date Filter & Department for Reports */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <Input type="date" label="Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input type="date" label="End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <Select 
          label="Department" 
          value={department} 
          onChange={e => setDepartment(e.target.value)}
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
        <div className="ml-auto flex gap-2">
           <Button variant="outline" onClick={() => {
             const today = format(new Date(), 'yyyy-MM-dd');
             setStartDate(today); setEndDate(today);
           }}>Today</Button>
           <Button variant="outline" onClick={() => {
             const start = format(subDays(new Date(), 7), 'yyyy-MM-dd');
             const today = format(new Date(), 'yyyy-MM-dd');
             setStartDate(start); setEndDate(today);
           }}>Last 7 Days</Button>
        </div>
      </div>

      {/* Summary Cards */}
      {reports && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center">
            <div className="p-3 rounded-full bg-success-50 text-success-600 mr-4">
              <HiOutlineChartPie className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Present %</p>
              <p className="text-xl font-bold text-gray-900">{reports.presentPercentage?.toFixed(1) || 0}%</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center">
            <div className="p-3 rounded-full bg-danger-50 text-danger-600 mr-4">
              <HiOutlineChartPie className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Absent / Leave %</p>
              <p className="text-xl font-bold text-gray-900">
                {((reports.absentPercentage || 0) + (reports.leavePercentage || 0)).toFixed(1)}%
              </p>
            </div>
          </Card>
          <Card className="p-4 flex items-center">
            <div className="p-3 rounded-full bg-primary-50 text-primary-600 mr-4">
              <HiOutlineClock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Work Hrs</p>
              <p className="text-xl font-bold text-gray-900">{(reports.avgWorkHours ?? reports.averageWorkHours ?? 0).toFixed(2)}h</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center">
            <div className="p-3 rounded-full bg-warning-50 text-warning-600 mr-4">
              <HiOutlineDocumentReport className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Extra Hrs</p>
              <p className="text-xl font-bold text-gray-900">{reports.totalExtraHours?.toFixed(1) || 0}h</p>
            </div>
          </Card>
        </div>
      )}

      {/* Table Section */}
      <Card title="Attendance Records">
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
              value={status} 
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Present', value: 'present' },
                { label: 'Absent', value: 'absent' },
                { label: 'Half Day', value: 'half_day' },
                { label: 'Leave', value: 'leave' }
              ]}
            />
          </div>
        </div>

        <Table 
          columns={columns} 
          data={records} 
          loading={loading}
          emptyMessage="No attendance records found."
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

export default AdminAttendancePage;
