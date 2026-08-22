import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import * as employeeService from '../../services/employeeService';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';

const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', gender: '', dateOfBirth: '',
    department: '', designation: '', location: '', joiningDate: '', manager: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    nationality: '', personalEmail: '', maritalStatus: '',
    accountNumber: '', bankName: '', ifsc: '', pan: '', uan: ''
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await employeeService.getEmployee(id);
        if (response.success) {
          const emp = response.data;
          
          // Format dates for inputs (YYYY-MM-DD)
          const formatDate = (dateStr) => {
            if (!dateStr) return '';
            return new Date(dateStr).toISOString().split('T')[0];
          };

          setFormData({
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            phone: emp.phone || '',
            gender: emp.gender || '',
            dateOfBirth: formatDate(emp.dateOfBirth),
            department: emp.department || '',
            designation: emp.designation || '',
            location: emp.location || '',
            joiningDate: formatDate(emp.joiningDate),
            manager: emp.manager || '',
            address: {
              street: emp.address?.street || '',
              city: emp.address?.city || '',
              state: emp.address?.state || '',
              zipCode: emp.address?.zipCode || '',
              country: emp.address?.country || ''
            },
            nationality: emp.nationality || '',
            personalEmail: emp.personalEmail || '',
            maritalStatus: emp.maritalStatus || '',
            accountNumber: emp.accountNumber || '',
            bankName: emp.bankName || '',
            ifsc: emp.ifsc || '',
            pan: emp.pan || '',
            uan: emp.uan || ''
          });
        }
      } catch (err) {
        setError('Failed to fetch employee details');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await employeeService.updateEmployee(id, formData);
      if (response.success) {
        toast.success('Employee updated successfully');
        navigate(`/admin/employees/${id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/admin/employees/${id}`)}>
          <HiOutlineArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
            <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
            <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
            <Select 
              label="Gender" name="gender" value={formData.gender} onChange={handleChange}
              options={[
                { label: 'Select Gender', value: '' },
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' }
              ]} 
            />
            <Input label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
          </div>
        </Card>

        <Card title="Employment Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select 
              label="Department" name="department" value={formData.department} onChange={handleChange} required
              options={[
                { label: 'Select Department', value: '' },
                { label: 'Engineering', value: 'Engineering' },
                { label: 'HR', value: 'HR' },
                { label: 'Finance', value: 'Finance' },
                { label: 'Marketing', value: 'Marketing' },
                { label: 'Sales', value: 'Sales' },
                { label: 'Operations', value: 'Operations' }
              ]} 
            />
            <Input label="Designation" name="designation" value={formData.designation} onChange={handleChange} required />
            <Input label="Location" name="location" value={formData.location} onChange={handleChange} />
            <Input label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} required />
            <Input label="Manager ID" name="manager" value={formData.manager} onChange={handleChange} />
          </div>
        </Card>

        <Card title="Personal Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input label="Personal Email" name="personalEmail" type="email" value={formData.personalEmail} onChange={handleChange} />
            <Input label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
            <Select 
              label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}
              options={[
                { label: 'Select Status', value: '' },
                { label: 'Single', value: 'single' },
                { label: 'Married', value: 'married' },
                { label: 'Divorced', value: 'divorced' },
                { label: 'Widowed', value: 'widowed' }
              ]} 
            />
          </div>
          <h4 className="text-sm font-medium text-gray-900 mb-4 mt-6">Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Street" name="address.street" value={formData.address.street} onChange={handleChange} className="md:col-span-2" />
            <Input label="City" name="address.city" value={formData.address.city} onChange={handleChange} />
            <Input label="State" name="address.state" value={formData.address.state} onChange={handleChange} />
            <Input label="ZIP Code" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} />
            <Input label="Country" name="address.country" value={formData.address.country} onChange={handleChange} />
          </div>
        </Card>

        <Card title="Banking & Statutory Info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
            <Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
            <Input label="IFSC Code" name="ifsc" value={formData.ifsc} onChange={handleChange} />
            <Input label="PAN Number" name="pan" value={formData.pan} onChange={handleChange} />
            <Input label="UAN Number" name="uan" value={formData.uan} onChange={handleChange} />
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(`/admin/employees/${id}`)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditEmployeePage;
