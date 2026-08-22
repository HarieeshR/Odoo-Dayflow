import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { HiOutlineSearch, HiCheck, HiX } from 'react-icons/hi';
import * as leaveService from '../../services/leaveService';
import { leaveTypeName, listItems, listTotal } from '../../utils/response';
import useDebounce from '../../hooks/useDebounce';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';

const LeaveApprovalPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [actionModal, setActionModal] = useState({ open: false, type: '', request: null });
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await leaveService.getAllLeaveRequests({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit
      });
      if (res.success) {
        setRequests(listItems(res.data));
        setTotal(listTotal(res.data));
      }
    } catch (err) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, debouncedSearch]);

  const handleAction = async () => {
    setActionLoading(true);
    try {
      if (actionModal.type === 'approve') {
        await leaveService.approveLeave(actionModal.request._id, comments);
        toast.success('Leave approved successfully');
      } else {
        await leaveService.rejectLeave(actionModal.request._id, comments);
        toast.success('Leave rejected');
      }
      setActionModal({ open: false, type: '', request: null });
      setComments('');
      fetchRequests(); // Refresh table
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.employee?.firstName} {row.employee?.lastName}</div>
          <div className="text-gray-500 text-xs">{row.employee?.employeeId}</div>
        </div>
      )
    },
    {
      key: 'leaveType',
      label: 'Type',
      render: (val) => leaveTypeName(val)
    },
    {
      key: 'dates',
      label: 'Duration',
      render: (_, row) => (
        <div>
          <div>{format(new Date(row.startDate), 'MMM d, yy')} - {format(new Date(row.endDate), 'MMM d, yy')}</div>
          <div className="text-xs text-gray-500">{row.totalDays} days</div>
        </div>
      )
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
      key: 'actions',
      label: 'Actions',
      render: (_, row) => row.status === 'pending' ? (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="ghost"
            className="text-success-600 hover:bg-success-50"
            onClick={() => setActionModal({ open: true, type: 'approve', request: row })}
            title="Approve"
          >
            <HiCheck className="h-5 w-5" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            className="text-danger-600 hover:bg-danger-50"
            onClick={() => setActionModal({ open: true, type: 'reject', request: row })}
            title="Reject"
          >
            <HiX className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <span className="text-sm text-gray-400">Processed</span>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
        <Button variant="outline" onClick={() => window.location.href='/admin/leave/balances'}>
          View Leave Balances
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4 border-b border-gray-200 pb-4">
          <div className="flex space-x-8">
            {[
              { label: 'Pending', value: 'pending' },
              { label: 'All', value: '' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' }
            ].map(tab => (
              <button
                key={tab.label}
                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                className={`pb-4 px-1 -mb-4 border-b-2 font-medium text-sm transition-colors ${
                  statusFilter === tab.value
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="w-full md:w-64">
            <Input
              icon={HiOutlineSearch}
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <Table 
          columns={columns} 
          data={requests} 
          loading={loading}
          emptyMessage={`No ${statusFilter} leave requests found.`}
        />

        {!loading && total > 0 && (
          <Pagination 
            currentPage={page} 
            totalPages={Math.ceil(total / limit)} 
            onPageChange={setPage} 
          />
        )}
      </Card>

      {/* Action Modal */}
      {actionModal.request && (
        <Modal 
          isOpen={actionModal.open} 
          onClose={() => setActionModal({ open: false, type: '', request: null })}
          title={actionModal.type === 'approve' ? 'Approve Leave' : 'Reject Leave'}
        >
          <div className="mb-4 text-sm text-gray-600">
            <p><strong>Employee:</strong> {actionModal.request.employee?.firstName} {actionModal.request.employee?.lastName}</p>
            <p><strong>Type:</strong> {leaveTypeName(actionModal.request.leaveType)}</p>
            <p><strong>Days:</strong> {actionModal.request.totalDays} ({format(new Date(actionModal.request.startDate), 'MMM d')} - {format(new Date(actionModal.request.endDate), 'MMM d')})</p>
            <p><strong>Reason:</strong> {actionModal.request.reason}</p>
          </div>
          
          <Textarea 
            label="Admin Comments (Optional)" 
            value={comments} 
            onChange={(e) => setComments(e.target.value)} 
            placeholder="Add any notes or comments..."
          />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setActionModal({ open: false, type: '', request: null })} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              className={actionModal.type === 'approve' ? 'bg-success-600 hover:bg-success-700' : 'bg-danger-600 hover:bg-danger-700'}
              onClick={handleAction}
              loading={actionLoading}
            >
              {actionModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeaveApprovalPage;
