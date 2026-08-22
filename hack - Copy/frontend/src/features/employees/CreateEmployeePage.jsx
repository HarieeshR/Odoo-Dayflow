import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineDuplicate } from 'react-icons/hi';
import * as employeeService from '../../services/employeeService';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const CreateEmployeePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '', lastName: '', email: '', phone: '', gender: '', dateOfBirth: '',
    // Employment
    department: '', designation: '', location: '', joiningDate: '', manager: '', employeeCode: '',
    // Personal
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    nationality: '', personalEmail: '', maritalStatus: '',
    // Banking/Statutory
    accountNumber: '', bankName: '', ifsc: '', pan: '', uan: ''
  });

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
    setLoading(true);
    
    // Cleanup empty optional fields to prevent validation errors on backend if needed
    const dataToSend = { ...formData };
    
    try {
      const response = await employeeService.createEmployee(dataToSend);
      if (response.success) {
        toast.success('Employee created successfully');
        setCreatedCredentials({
          employeeId: response.data.employee.employeeId,
          email: response.data.employee.email,
          temporaryPassword: response.data.temporaryPassword
        });
        setShowSuccessModal(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (createdCredentials) {
      const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.temporaryPassword}`;
      navigator.clipboard.writeText(text);
      toast.success('Credentials copied to clipboard');
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/admin/employees');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/employees')}>
          <HiOutlineArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Info */}
        <Card title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
            <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
            <Input label="Work Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
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

        {/* Section 2: Employment Info */}
        <Card title="Employment Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Employee Code (Optional)" name="employeeCode" value={formData.employeeCode} onChange={handleChange} placeholder="Will be auto-generated if left blank" />
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
            <Input label="Manager ID" name="manager" value={formData.manager} onChange={handleChange} placeholder="Optional" />
          </div>
        </Card>

        {/* Section 3: Personal Info */}
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

        {/* Section 4: Banking Info */}
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
          <Button type="button" variant="outline" onClick={() => navigate('/admin/employees')} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Employee
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={closeSuccessModal} title="Employee Created Successfully">
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 mb-4">
            <svg className="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Generated</h3>
          <p className="text-sm text-gray-500 mb-6">
            Please share these temporary credentials with the employee. They will be required to change their password on first login.
          </p>
          
          {createdCredentials && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 text-left relative">
              <p className="text-sm"><span className="font-medium text-gray-700">Employee ID:</span> {createdCredentials.employeeId}</p>
              <p className="text-sm mt-2"><span className="font-medium text-gray-700">Email:</span> {createdCredentials.email}</p>
              <p className="text-sm mt-2"><span className="font-medium text-gray-700">Temp Password:</span> <span className="font-mono bg-white px-2 py-1 border rounded">{createdCredentials.temporaryPassword}</span></p>
              <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={copyCredentials}>
                <HiOutlineDuplicate className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          <Button fullWidth onClick={closeSuccessModal}>
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CreateEmployeePage;
