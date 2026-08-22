import React, { useState, useEffect } from 'react';
import * as auditService from '../../services/auditService';
import { listItems, listTotalPages } from '../../utils/response';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Details Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
        action,
        entityType,
        startDate,
        endDate
      };
      // Clean up empty params
      Object.keys(params).forEach(k => !params[k] && delete params[k]);

      const res = await auditService.getAuditLogs(params);
      if (res.success) {
        setLogs(listItems(res.data));
        setTotalPages(listTotalPages(res.data));
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeColor = (act) => {
    if (act.includes('CREATED') || act.includes('APPROVED')) return 'success';
    if (act.includes('DELETED') || act.includes('REJECTED')) return 'danger';
    if (act.includes('UPDATED') || act.includes('CHANGED') || act.includes('ADJUSTED')) return 'warning';
    return 'default';
  };

  const openDetails = (log) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>

      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <Select
            label="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            options={[
              { value: '', label: 'All Actions' },
              { value: 'EMPLOYEE_CREATED', label: 'EMPLOYEE_CREATED' },
              { value: 'EMPLOYEE_UPDATED', label: 'EMPLOYEE_UPDATED' },
              { value: 'EMPLOYEE_STATUS_CHANGED', label: 'EMPLOYEE_STATUS_CHANGED' },
              { value: 'CREDENTIALS_RESET', label: 'CREDENTIALS_RESET' },
              { value: 'LEAVE_APPROVED', label: 'LEAVE_APPROVED' },
              { value: 'LEAVE_REJECTED', label: 'LEAVE_REJECTED' },
              { value: 'LEAVE_BALANCE_ADJUSTED', label: 'LEAVE_BALANCE_ADJUSTED' },
              { value: 'SALARY_UPDATED', label: 'SALARY_UPDATED' },
            ]}
          />
          <Select
            label="Entity Type"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            options={[
              { value: '', label: 'All Entities' },
              { value: 'Employee', label: 'Employee' },
              { value: 'User', label: 'User' },
              { value: 'LeaveRequest', label: 'LeaveRequest' },
              { value: 'LeaveBalance', label: 'LeaveBalance' },
              { value: 'SalaryStructure', label: 'SalaryStructure' },
            ]}
          />
          <Input 
            type="date" 
            label="Start Date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
          <Input 
            type="date" 
            label="End Date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
          <div>
            <Button type="submit" className="w-full">Filter</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          {loading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner /></div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchLogs} />
          ) : logs.length === 0 ? (
            <EmptyState message="No audit logs found matching criteria" />
          ) : (
            <>
              <Table 
                columns={[
                  { 
                    key: 'timestamp', 
                    label: 'Timestamp',
                    render: (log) => new Date(log.createdAt).toLocaleString()
                  },
                  { 
                    key: 'actor', 
                    label: 'Actor',
                    render: (log) => log.actor?.email || log.actor || 'System'
                  },
                  { 
                    key: 'action', 
                    label: 'Action',
                    render: (log) => (
                      <Badge variant={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    )
                  },
                  { key: 'entityType', label: 'Entity Type' },
                  { 
                    key: 'entityId', 
                    label: 'Entity ID',
                    render: (log) => {
                      const id = String(log.entityId);
                      return id.length > 10 ? `${id.substring(0, 10)}...` : id;
                    }
                  },
                  { 
                    key: 'actions', 
                    label: 'Details',
                    render: (log) => (
                      <Button variant="outline" size="sm" onClick={() => openDetails(log)}>
                        View
                      </Button>
                    )
                  }
                ]}
                data={logs}
              />
              <div className="mt-4">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Audit Log Details">
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {selectedLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <div className="font-semibold text-gray-600">Action:</div>
                <div>{selectedLog.action}</div>
                
                <div className="font-semibold text-gray-600">Actor:</div>
                <div>{selectedLog.actor?.email || selectedLog.actor || 'System'}</div>
                
                <div className="font-semibold text-gray-600">Timestamp:</div>
                <div>{new Date(selectedLog.createdAt).toLocaleString()}</div>
                
                <div className="font-semibold text-gray-600">Entity Type:</div>
                <div>{selectedLog.entityType}</div>
                
                <div className="font-semibold text-gray-600">Entity ID:</div>
                <div className="break-all">{selectedLog.entityId}</div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Previous Values</h4>
                <div className="bg-gray-50 p-3 rounded-md border overflow-x-auto">
                  <pre className="text-xs text-gray-800">
                    {selectedLog.oldValue || selectedLog.oldValues
                      ? JSON.stringify(selectedLog.oldValue ?? selectedLog.oldValues, null, 2)
                      : 'N/A'}
                  </pre>
                </div>
              </div>
 
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">New Values</h4>
                <div className="bg-gray-50 p-3 rounded-md border overflow-x-auto">
                  <pre className="text-xs text-gray-800">
                    {selectedLog.newValue || selectedLog.newValues
                      ? JSON.stringify(selectedLog.newValue ?? selectedLog.newValues, null, 2)
                      : 'N/A'}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AuditLogPage;
