import React, { useState, useEffect } from 'react';
import * as reportService from '../../services/reportService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: ''
  });
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (activeTab === 'attendance') {
        res = await reportService.getAttendanceReport(filters);
      } else if (activeTab === 'leave') {
        res = await reportService.getLeaveReport(filters);
      } else if (activeTab === 'payroll') {
        res = await reportService.getPayrollReport(filters);
      }
      
      if (res && res.success) {
        setData(res.data);
      } else {
        setError(res?.message || 'Failed to fetch report data');
      }
    } catch (err) {
      setError(err.message || 'Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

  const renderAttendanceTab = () => {
    if (!data) return null;
    const summary = data.summary || data;
    const dailyMap = {};
    (data.dailyBreakdown || []).forEach((item) => {
      const key = item.date ? new Date(item.date).toISOString().slice(0, 10) : 'unknown';
      if (!dailyMap[key]) dailyMap[key] = { date: key, presentCount: 0, absentCount: 0 };
      if (item.status === 'present' || item.status === 'half_day') dailyMap[key].presentCount += item.count;
      if (item.status === 'absent' || item.status === 'leave') dailyMap[key].absentCount += item.count;
    });
    const dailyChart = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card title="Total Records">
            <p className="text-2xl font-semibold">{summary.totalRecords || 0}</p>
          </Card>
          <Card title="Present %">
            <p className="text-2xl font-semibold text-green-600">{summary.presentPercentage || 0}%</p>
          </Card>
          <Card title="Absent %">
            <p className="text-2xl font-semibold text-red-600">{summary.absentPercentage || 0}%</p>
          </Card>
          <Card title="Avg Work Hours">
            <p className="text-2xl font-semibold">{summary.averageWorkHours || summary.avgWorkHours || 0} hrs</p>
          </Card>
        </div>
        
        {dailyChart.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow h-80">
            <h3 className="text-lg font-medium mb-4">Daily Attendance Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="presentCount" stroke="#10B981" name="Present" />
                <Line type="monotone" dataKey="absentCount" stroke="#EF4444" name="Absent" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderLeaveTab = () => {
    if (!data) return null;
    const summary = data.summary || data;
    
    const pieData = [
      { name: 'Approved', value: summary.approved || 0 },
      { name: 'Pending', value: summary.pending || 0 },
      { name: 'Rejected', value: summary.rejected || 0 },
    ].filter(item => item.value > 0);

    const departmentChart = (data.departmentDistribution || []).map((item) => ({
      department: item.department || item._id || 'Unknown',
      count: item.count
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card title="Total Requests">
            <p className="text-2xl font-semibold">{summary.totalRequests || 0}</p>
          </Card>
          <Card title="Approved">
            <p className="text-2xl font-semibold text-green-600">{summary.approved || 0}</p>
          </Card>
          <Card title="Rejected">
            <p className="text-2xl font-semibold text-red-600">{summary.rejected || 0}</p>
          </Card>
          <Card title="Pending">
            <p className="text-2xl font-semibold text-yellow-600">{summary.pending || 0}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow h-80">
            <h3 className="text-lg font-medium mb-4">Leave Status Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name === 'Approved' ? '#10B981' : 
                      entry.name === 'Rejected' ? '#EF4444' : 
                      '#F59E0B'
                    } />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {departmentChart.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow h-80">
              <h3 className="text-lg font-medium mb-4">Leaves by Department</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" name="Leave Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPayrollTab = () => {
    if (!data) return null;
    const summary = data.summary || data;
    const departmentChart = (data.departmentPayroll || []).map((item) => ({
      department: item.department || item._id || 'Unknown',
      total: item.total || item.totalPayroll || 0
    }));
    const componentChart = (data.componentDistribution || []).map((item) => ({
      name: item.name || item._id || 'Component',
      value: item.value || item.totalAmount || 0
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card title="Total Monthly Payroll">
            <p className="text-2xl font-semibold">{formatCurrency(summary.totalPayroll || 0)}</p>
          </Card>
          <Card title="Average Salary">
            <p className="text-2xl font-semibold">{formatCurrency(summary.averageSalary || summary.avgSalary || 0)}</p>
          </Card>
          <Card title="Min Salary">
            <p className="text-2xl font-semibold">{formatCurrency(summary.minSalary || 0)}</p>
          </Card>
          <Card title="Max Salary">
            <p className="text-2xl font-semibold">{formatCurrency(summary.maxSalary || 0)}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departmentChart.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow h-80">
              <h3 className="text-lg font-medium mb-4">Department-wise Payroll</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total" fill="#8B5CF6" name="Total Payroll" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {componentChart.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow h-80">
              <h3 className="text-lg font-medium mb-4">Component Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={componentChart} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
                    {componentChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['attendance', 'leave', 'payroll'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
        <Input 
          type="date" 
          label="Start Date" 
          value={filters.startDate} 
          onChange={(e) => setFilters({...filters, startDate: e.target.value})} 
        />
        <Input 
          type="date" 
          label="End Date" 
          value={filters.endDate} 
          onChange={(e) => setFilters({...filters, endDate: e.target.value})} 
        />
        <Select 
          label="Department"
          value={filters.department}
          onChange={(e) => setFilters({...filters, department: e.target.value})}
          options={[
            { value: '', label: 'All Departments' },
            { value: 'Engineering', label: 'Engineering' },
            { value: 'HR', label: 'HR' },
            { value: 'Finance', label: 'Finance' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Sales', label: 'Sales' },
            { value: 'Operations', label: 'Operations' },
          ]}
        />
        <Button onClick={fetchData} disabled={loading}>Fetch</Button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            {activeTab === 'attendance' && renderAttendanceTab()}
            {activeTab === 'leave' && renderLeaveTab()}
            {activeTab === 'payroll' && renderPayrollTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
