import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { HiOutlinePlus } from 'react-icons/hi';
import * as leaveService from '../../services/leaveService';
import { leaveTypeId, leaveTypeName, listItems, listTotal } from '../../utils/response';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const LeaveRequestPage = () => {
  const [balance, setBalance] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    attachment: null
  });

  const fetchBalance = async () => {
    try {
      const res = await leaveService.getMyLeaveBalance();
      if (res.success) {
        setBalance(res.data.balance || listItems(res.data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await leaveService.getMyLeaveRequests({ status: statusFilter, page, limit });
      if (res.success) {
        setHistory(listItems(res.data));
        setTotal(listTotal(res.data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('All fields are required');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }

    setSubmitting(true);
    try {
      const selected = balance.find(b => (b.leaveTypeId || leaveTypeId(b.leaveType)) === formData.leaveType);
      if (selected?.requiresAttachment && !formData.attachment) {
        toast.error('An attachment is required for this leave type');
        setSubmitting(false);
        return;
      }

      const payload = new FormData();
      payload.append('leaveType', formData.leaveType);
      payload.append('startDate', formData.startDate);
      payload.append('endDate', formData.endDate);
      payload.append('reason', formData.reason);
      if (formData.attachment) payload.append('attachment', formData.attachment);

      const res = await leaveService.createLeaveRequest(payload);
      if (res.success) {
        toast.success('Leave request submitted successfully');
        setModalOpen(false);
        setFormData({ leaveType: '', startDate: '', endDate: '', reason: '', attachment: null });
        fetchHistory();
        fetchBalance();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const leaveOptions = balance.map(b => ({
    label: `${leaveTypeName(b.leaveType)} (Bal: ${b.remainingDays})`,
    value: b.leaveTypeId || leaveTypeId(b.leaveType)
  }));

  const columns = [
    {
      key: 'leaveType',
      label: 'Type',
      render: (val) => leaveTypeName(val)
    },
    {
      key: 'dates',
      label: 'Duration',
      render: (_, row) => `${format(new Date(row.startDate), 'MMM d, yy')} - ${format(new Date(row.endDate), 'MMM d, yy')}`
    },
    {
      key: 'totalDays',
      label: 'Days'
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (val) => <span className="truncate max-w-xs inline-block" title={val}>{val}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const variant = val === 'approved' ? 'success' : val === 'rejected' ? 'danger' : 'warning';
        return <Badge variant={variant}>{val.toUpperCase()}</Badge>;
      }
    },
    {
      key: 'appliedOn',
      label: 'Applied On',
      render: (_, row) => format(new Date(row.createdAt), 'MMM d, yyyy')
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <Button icon={HiOutlinePlus} onClick={() => setModalOpen(true)}>
          Apply for Leave
        </Button>
      </div>

      {/* Balance Cards */}
      {balanceLoading ? (
        <div className="flex justify-center p-8"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {balance.map(b => (
            <Card key={b._id || b.leaveTypeId} className="p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase">{leaveTypeName(b.leaveType)}</h3>
              <div className="mt-2 flex justify-between items-baseline">
                <p className="text-3xl font-bold text-gray-900">{b.remainingDays}</p>
                <p className="text-sm text-gray-500">of {b.totalDays} remaining</p>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, (b.usedDays / b.totalDays) * 100))}%` }}
                ></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* History Table */}
      <Card title="My Leave Requests">
        <div className="mb-6 flex">
          <div className="flex border-b border-gray-200 w-full space-x-8">
            {[
              { label: 'All', value: '' },
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' }
            ].map(tab => (
              <button
                key={tab.label}
                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  statusFilter === tab.value
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Table 
          columns={columns} 
          data={history} 
          loading={historyLoading}
          emptyMessage="No leave requests found."
        />

        {!historyLoading && total > 0 && (
          <Pagination 
            currentPage={page} 
            totalPages={Math.ceil(total / limit)} 
            onPageChange={setPage} 
          />
        )}
      </Card>

      {/* Apply Leave Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select 
            label="Leave Type" 
            value={formData.leaveType}
            onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
            options={[{ label: 'Select Leave Type', value: '' }, ...leaveOptions]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              type="date" 
              label="Start Date" 
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input 
              type="date" 
              label="End Date" 
              value={formData.endDate}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <Textarea 
            label="Reason" 
            rows={3} 
            value={formData.reason}
            onChange={e => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Please specify the reason for your leave..."
            required
          />
          <Input
            type="file"
            label={balance.find(b => (b.leaveTypeId || leaveTypeId(b.leaveType)) === formData.leaveType)?.requiresAttachment ? 'Attachment *' : 'Attachment (optional)'}
            onChange={e => setFormData({ ...formData, attachment: e.target.files?.[0] || null })}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveRequestPage;
