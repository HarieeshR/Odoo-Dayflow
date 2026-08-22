import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { HiOutlineClock, HiOutlineCalendar } from 'react-icons/hi';
import * as attendanceService from '../../services/attendanceService';
import { asRecord, listItems, listTotal } from '../../utils/response';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AttendancePage = () => {
  const [todayRecord, setTodayRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchTodayAttendance = async () => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const response = await attendanceService.getMyAttendance({
        startDate: todayStr,
        endDate: todayStr,
        limit: 1
      });
      const items = listItems(response.data);
      if (response.success && items.length > 0) {
        setTodayRecord(items[0]);
      } else {
        setTodayRecord(null);
      }
    } catch (err) {
      console.error('Failed to fetch today attendance', err);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await attendanceService.getMyAttendance({
        startDate,
        endDate,
        status,
        page,
        limit
      });
      if (response.success) {
        setHistory(listItems(response.data));
        setTotal(listTotal(response.data));
      }
    } catch (err) {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, startDate, endDate, status]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceService.checkIn();
      if (res.success) {
        toast.success('Checked in successfully!');
        setTodayRecord(asRecord(res.data));
        fetchHistory(); // Refresh table
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceService.checkOut();
      if (res.success) {
        toast.success('Checked out successfully!');
        setTodayRecord(asRecord(res.data));
        fetchHistory(); // Refresh table
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
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
      label: 'Work Hours',
      render: (val) => val ? `${val.toFixed(2)}h` : '-'
    },
    {
      key: 'extraHours',
      label: 'Extra Hours',
      render: (val) => val && val > 0 ? `${val.toFixed(2)}h` : '-'
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>

      <Card title="Today's Attendance" className="border-t-4 border-t-primary-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <div className="bg-primary-50 p-4 rounded-full text-primary-600 mr-4">
              <HiOutlineClock className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              <h3 className="text-xl font-bold text-gray-900">
                {todayRecord?.status === 'present' || todayRecord?.status === 'half_day' ? 'Working Today' : 'Not Checked In'}
              </h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Check In Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayRecord?.checkIn ? format(new Date(todayRecord.checkIn), 'h:mm a') : '--:--'}
              </p>
            </div>
            <div className="hidden sm:block border-l border-gray-200"></div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Check Out Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayRecord?.checkOut ? format(new Date(todayRecord.checkOut), 'h:mm a') : '--:--'}
              </p>
            </div>
            <div className="hidden sm:block border-l border-gray-200"></div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Hours</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayRecord?.workHours ? `${todayRecord.workHours.toFixed(2)}h` : '--'}
              </p>
            </div>
          </div>

          <div>
            {!todayRecord?.checkIn && (
              <Button size="lg" className="bg-success-600 hover:bg-success-700" onClick={handleCheckIn} loading={actionLoading}>
                Check In
              </Button>
            )}
            {todayRecord?.checkIn && !todayRecord?.checkOut && (
              <Button size="lg" className="bg-warning-500 hover:bg-warning-600" onClick={handleCheckOut} loading={actionLoading}>
                Check Out
              </Button>
            )}
            {todayRecord?.checkIn && todayRecord?.checkOut && (
              <Badge variant="success" size="lg" className="px-4 py-2 text-base">Completed for Today</Badge>
            )}
          </div>
        </div>
      </Card>

      <Card title="Attendance History">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input type="date" label="Start Date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
          <Input type="date" label="End Date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
          <Select 
            label="Status" 
            value={status} 
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            options={[
              { label: 'All', value: '' },
              { label: 'Present', value: 'present' },
              { label: 'Absent', value: 'absent' },
              { label: 'Half Day', value: 'half_day' },
              { label: 'Leave', value: 'leave' }
            ]}
          />
        </div>

        <Table 
          columns={columns} 
          data={history} 
          loading={loading}
          emptyMessage="No attendance records found for this period."
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

export default AttendancePage;
