import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineAdjustments } from 'react-icons/hi';
import * as leaveService from '../../services/leaveService';
import { leaveTypeId, leaveTypeName, listItems, listTotal } from '../../utils/response';
import useDebounce from '../../hooks/useDebounce';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';

const LeaveBalancePage = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [adjustModal, setAdjustModal] = useState({ open: false, data: null });
  const [adjustForm, setAdjustForm] = useState({ leaveType: '', adjustmentAmount: '', reason: '' });
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const res = await leaveService.getAllLeaveBalances({
        search: debouncedSearch,
        page,
        limit
      });
      if (res.success) {
        setBalances(listItems(res.data));
        setTotal(listTotal(res.data));
      }
    } catch (err) {
      toast.error('Failed to load leave balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustLoading(true);
    try {
      const payload = {
        leaveType: adjustForm.leaveType,
        adjustmentAmount: Number(adjustForm.adjustmentAmount),
        reason: adjustForm.reason
      };
      const res = await leaveService.adjustLeaveBalance(adjustModal.data.employee._id, payload);
      if (res.success) {
        toast.success('Leave balance adjusted successfully');
        setAdjustModal({ open: false, data: null });
        setAdjustForm({ leaveType: '', adjustmentAmount: '', reason: '' });
        fetchBalances(); // Refresh
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust balance');
    } finally {
      setAdjustLoading(false);
    }
  };

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900">{row.employee?.firstName} {row.employee?.lastName}</div>
          <div className="text-gray-500 text-xs">{row.employee?.employeeId} • {row.employee?.department}</div>
        </div>
      )
    },
    {
      key: 'balances',
      label: 'Balances (Type: Rem/Total)',
      render: (_, row) => (
        <div className="flex flex-wrap gap-2">
          {row.balance?.map(b => (
            <span key={b.leaveTypeId || b._id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {leaveTypeName(b.leaveType)}: {b.remainingDays}/{b.totalDays}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setAdjustModal({ open: true, data: row })}
        >
          <HiOutlineAdjustments className="h-4 w-4 mr-1" /> Adjust
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Employee Leave Balances</h1>

      <Card>
        <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="w-full sm:w-64">
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
          data={balances} 
          loading={loading}
          emptyMessage="No balance records found."
        />

        {!loading && total > 0 && (
          <Pagination 
            currentPage={page} 
            totalPages={Math.ceil(total / limit)} 
            onPageChange={setPage} 
          />
        )}
      </Card>

      {/* Adjust Modal */}
      {adjustModal.data && (
        <Modal 
          isOpen={adjustModal.open} 
          onClose={() => setAdjustModal({ open: false, data: null })}
          title="Adjust Leave Balance"
        >
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900">
              Adjusting for: {adjustModal.data.employee.firstName} {adjustModal.data.employee.lastName}
            </p>
          </div>
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <Select 
              label="Leave Type" 
              value={adjustForm.leaveType}
              onChange={e => setAdjustForm({ ...adjustForm, leaveType: e.target.value })}
              options={[
                { label: 'Select Type', value: '' },
                ...adjustModal.data.balance.map(b => ({
                  label: `${leaveTypeName(b.leaveType)} (Current: ${b.remainingDays})`,
                  value: b.leaveTypeId || leaveTypeId(b.leaveType)
                }))
              ]}
              required
            />
            <Input 
              type="number" 
              step="0.5" 
              label="Adjustment Amount (Days)" 
              placeholder="e.g. 1.5 for addition, -1 for deduction"
              value={adjustForm.adjustmentAmount}
              onChange={e => setAdjustForm({ ...adjustForm, adjustmentAmount: e.target.value })}
              required
            />
            <Textarea 
              label="Reason for Adjustment" 
              value={adjustForm.reason}
              onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              placeholder="Provide reason for this manual adjustment"
              required
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setAdjustModal({ open: false, data: null })} disabled={adjustLoading}>
                Cancel
              </Button>
              <Button type="submit" loading={adjustLoading}>
                Submit Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LeaveBalancePage;
