import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { HiOutlineArrowLeft, HiOutlinePencilAlt, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import * as employeeService from '../../services/employeeService';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import Modal from '../../components/ui/Modal';

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tabs: overview, personal, banking, actions
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modals
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEmployee = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await employeeService.getEmployee(id);
      if (response.success) {
        setEmployee(response.data);
      } else {
        setError('Failed to fetch employee details.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employee details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleStatus = async () => {
    setActionLoading(true);
    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await employeeService.updateEmployeeStatus(id, newStatus);
      if (response.success) {
        toast.success(`Employee status updated to ${newStatus}`);
        setEmployee(prev => ({ ...prev, status: newStatus }));
        setStatusModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetCredentials = async () => {
    setActionLoading(true);
    try {
      const response = await employeeService.resetCredentials(id);
      if (response.success) {
        toast.success('Credentials reset successfully. Check email for details.');
        setResetModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to reset credentials');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-12"><LoadingSpinner size="lg" /></div>;
  if (error || !employee) return <ErrorState message={error} onRetry={fetchEmployee} />;

  const InfoItem = ({ label, value }) => (
    <div className="sm:col-span-1">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/employees')}>
            <HiOutlineArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold border-2 border-white shadow-sm">
              {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {employee.firstName} {employee.lastName}
                <Badge variant={employee.status === 'active' ? 'success' : 'danger'}>
                  {employee.status.toUpperCase()}
                </Badge>
              </h1>
              <p className="text-sm text-gray-500">
                {employee.designation} • {employee.department} • {employee.employeeId}
              </p>
            </div>
          </div>
        </div>
        <Button 
          icon={HiOutlinePencilAlt} 
          onClick={() => navigate(`/admin/employees/${employee._id}/edit`)}
        >
          Edit Employee
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'personal', 'banking', 'actions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Work Information">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <InfoItem label="Employee ID" value={employee.employeeId} />
                <InfoItem label="Email" value={employee.email} />
                <InfoItem label="Department" value={employee.department} />
                <InfoItem label="Designation" value={employee.designation} />
                <InfoItem label="Location" value={employee.location} />
                <InfoItem label="Joining Date" value={employee.joiningDate ? format(new Date(employee.joiningDate), 'MMM d, yyyy') : '-'} />
                <InfoItem label="Manager ID" value={employee.manager?.toString()} />
              </dl>
            </Card>
            
            <Card title="Basic Details">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <InfoItem label="First Name" value={employee.firstName} />
                <InfoItem label="Last Name" value={employee.lastName} />
                <InfoItem label="Phone" value={employee.phone} />
                <InfoItem label="Gender" value={employee.gender} />
                <InfoItem label="Date of Birth" value={employee.dateOfBirth ? format(new Date(employee.dateOfBirth), 'MMM d, yyyy') : '-'} />
              </dl>
            </Card>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 gap-6">
            <Card title="Personal Information">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-8">
                <InfoItem label="Personal Email" value={employee.personalEmail} />
                <InfoItem label="Nationality" value={employee.nationality} />
                <InfoItem label="Marital Status" value={employee.maritalStatus} />
              </dl>
              
              <h4 className="text-sm font-medium text-gray-900 mb-4 border-t pt-4">Address</h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <InfoItem label="Street" value={employee.address?.street} />
                <InfoItem label="City" value={employee.address?.city} />
                <InfoItem label="State" value={employee.address?.state} />
                <InfoItem label="ZIP Code" value={employee.address?.zipCode} />
                <InfoItem label="Country" value={employee.address?.country} />
              </dl>
            </Card>
          </div>
        )}

        {activeTab === 'banking' && (
          <div className="grid grid-cols-1 gap-6">
            <Card title="Banking & Statutory Details">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <InfoItem label="Bank Name" value={employee.bankName} />
                <InfoItem label="Account Number" value={employee.accountNumber} />
                <InfoItem label="IFSC Code" value={employee.ifsc} />
                <InfoItem label="PAN Number" value={employee.pan} />
                <InfoItem label="UAN Number" value={employee.uan} />
              </dl>
            </Card>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Account Access">
              <p className="text-sm text-gray-500 mb-4">
                Force reset the user's password. They will receive a new temporary password via email (or you can view it in the response).
              </p>
              <Button 
                variant="outline" 
                icon={HiOutlineRefresh} 
                onClick={() => setResetModalOpen(true)}
              >
                Reset Credentials
              </Button>
            </Card>

            <Card title="Status Management">
              <p className="text-sm text-gray-500 mb-4">
                {employee.status === 'active' 
                  ? 'Deactivating will prevent the user from logging in and pause their payroll generation.'
                  : 'Activating will allow the user to log in and resume all system activities.'}
              </p>
              <Button 
                variant={employee.status === 'active' ? 'danger' : 'success'} 
                icon={employee.status === 'active' ? HiOutlineXCircle : HiOutlineCheckCircle}
                onClick={() => setStatusModalOpen(true)}
              >
                {employee.status === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      <Modal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="Confirm Status Change">
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to {employee.status === 'active' ? 'deactivate' : 'activate'} this employee?
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
          <Button 
            variant={employee.status === 'active' ? 'danger' : 'success'} 
            onClick={toggleStatus} 
            loading={actionLoading}
          >
            Yes, {employee.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Reset Credentials">
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to reset credentials for {employee.firstName}? A new temporary password will be generated.
        </p>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setResetModalOpen(false)}>Cancel</Button>
          <Button onClick={handleResetCredentials} loading={actionLoading}>
            Yes, Reset
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeDetailPage;
