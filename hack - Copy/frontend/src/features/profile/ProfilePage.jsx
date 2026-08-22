import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { HiOutlinePencilAlt, HiOutlineCamera } from 'react-icons/hi';
import * as profileService from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const BACKEND_URL = API_BASE.replace('/api/v1', '');

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [editSection, setEditSection] = useState(null); // 'personal' | 'about' | 'bank' | null

  const [formData, setFormData] = useState({
    phone: '', gender: '', dateOfBirth: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    nationality: '', personalEmail: '', maritalStatus: '',
    aboutMe: '',
    bankName: '', accountNumber: '', ifsc: '',
    pan: '', uan: ''
  });

  const getPhotoUrl = (emp) => {
    if (!emp) return null;
    if (emp.profilePhotoUrl) return emp.profilePhotoUrl;
    if (emp.profilePicture) {
      if (/^https?:\/\//i.test(emp.profilePicture)) return emp.profilePicture;
      return `${BACKEND_URL}/${emp.profilePicture.replace(/^\//, '')}`;
    }
    return null;
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await profileService.getMyProfile();
      if (response.success) {
        const emp = response.data;
        setProfile(emp);
        setPhotoPreview(getPhotoUrl(emp));

        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          return new Date(dateStr).toISOString().split('T')[0];
        };

        setFormData({
          phone: emp.phone || '',
          gender: emp.gender || '',
          dateOfBirth: formatDate(emp.dateOfBirth),
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
          aboutMe: emp.aboutMe || '',
          bankName: emp.bankDetails?.bankName || emp.bankName || '',
          accountNumber: emp.bankDetails?.accountNumber || emp.accountNumber || '',
          ifsc: emp.bankDetails?.ifsc || emp.ifsc || '',
          pan: emp.statutory?.pan || emp.pan || '',
          uan: emp.statutory?.uan || emp.uan || ''
        });
      }
    } catch (err) {
      setError('Failed to fetch profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('profilePicture', photoFile);
      const response = await profileService.updateMyProfile(fd);
      if (response.success) {
        toast.success('Profile photo updated!');
        setProfile(response.data);
        setPhotoPreview(getPhotoUrl(response.data));
        setPhotoFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (section) => {
    setSaving(true);
    try {
      let payload = {};

      if (section === 'personal') {
        payload = {
          phone: formData.phone,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          nationality: formData.nationality,
          personalEmail: formData.personalEmail,
          maritalStatus: formData.maritalStatus,
          address: JSON.stringify(formData.address)
        };
      } else if (section === 'about') {
        payload = { aboutMe: formData.aboutMe };
      } else if (section === 'bank') {
        payload = {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifsc,
          pan: formData.pan,
          uan: formData.uan
        };
      }

      const response = await profileService.updateMyProfile(payload);
      if (response.success) {
        toast.success('Profile updated successfully!');
        setProfile(response.data);
        setEditSection(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12"><LoadingSpinner size="lg" /></div>;
  if (error || !profile) return <ErrorState message={error} onRetry={fetchProfile} />;

  const InfoItem = ({ label, value }) => (
    <div className="sm:col-span-1">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
    </div>
  );

  const SectionHeader = ({ title, section }) => (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {editSection !== section && (
        <Button variant="ghost" size="sm" onClick={() => setEditSection(section)}>
          <HiOutlinePencilAlt className="mr-1 h-4 w-4" /> Edit
        </Button>
      )}
    </div>
  );

  const SectionFooter = ({ section }) => editSection === section && (
    <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
      <Button variant="outline" onClick={() => setEditSection(null)} disabled={saving}>Cancel</Button>
      <Button onClick={() => handleSaveSection(section)} loading={saving}>Save Changes</Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Photo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <div className="h-28 w-28 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-primary-700 text-4xl font-bold">
                {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 shadow-lg border-2 border-white"
          >
            <HiOutlineCamera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h1>
          <p className="text-gray-500">{profile.designation} • {profile.department}</p>
          <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-3">
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">ID: {profile.employeeId}</span>
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{profile.email}</span>
          </div>
          {photoFile && (
            <div className="mt-3">
              <Button size="sm" onClick={handlePhotoUpload} loading={saving}>Upload Photo</Button>
            </div>
          )}
        </div>
      </div>

      {/* About Me */}
      <Card>
        <SectionHeader title="About Me" section="about" />
        {editSection === 'about' ? (
          <>
            <Textarea
              name="aboutMe"
              value={formData.aboutMe}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              rows={4}
            />
            <SectionFooter section="about" />
          </>
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.aboutMe || 'No information provided yet.'}</p>
        )}
      </Card>

      {/* Employment Info (Read-only) */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6">
          <InfoItem label="Department" value={profile.department} />
          <InfoItem label="Designation" value={profile.designation} />
          <InfoItem label="Location" value={profile.location} />
          <InfoItem label="Joining Date" value={profile.joiningDate ? format(new Date(profile.joiningDate), 'MMM d, yyyy') : '-'} />
          <InfoItem label="Status" value={profile.employmentStatus} />
          <InfoItem label="Employee Code" value={profile.employeeCode} />
        </dl>
      </Card>

      {/* Personal Info (Editable) */}
      <Card>
        <SectionHeader title="Personal Information" section="personal" />
        {editSection === 'personal' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
              <Input label="Personal Email" name="personalEmail" type="email" value={formData.personalEmail} onChange={handleChange} />
              <Select
                label="Gender" name="gender" value={formData.gender} onChange={handleChange}
                options={[
                  { label: 'Select', value: '' },
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                  { label: 'Other', value: 'other' }
                ]}
              />
              <Input label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
              <Input label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
              <Select
                label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}
                options={[
                  { label: 'Select', value: '' },
                  { label: 'Single', value: 'single' },
                  { label: 'Married', value: 'married' },
                  { label: 'Divorced', value: 'divorced' },
                  { label: 'Widowed', value: 'widowed' }
                ]}
              />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mt-4 mb-3">Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Street" name="address.street" value={formData.address.street} onChange={handleChange} className="md:col-span-2" />
              <Input label="City" name="address.city" value={formData.address.city} onChange={handleChange} />
              <Input label="State" name="address.state" value={formData.address.state} onChange={handleChange} />
              <Input label="ZIP Code" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} />
              <Input label="Country" name="address.country" value={formData.address.country} onChange={handleChange} />
            </div>
            <SectionFooter section="personal" />
          </>
        ) : (
          <>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6 mb-6">
              <InfoItem label="Phone" value={profile.phone} />
              <InfoItem label="Personal Email" value={profile.personalEmail} />
              <InfoItem label="Gender" value={profile.gender} />
              <InfoItem label="Date of Birth" value={profile.dateOfBirth ? format(new Date(profile.dateOfBirth), 'MMM d, yyyy') : '-'} />
              <InfoItem label="Nationality" value={profile.nationality} />
              <InfoItem label="Marital Status" value={profile.maritalStatus} />
            </dl>
            <h4 className="text-sm font-medium text-gray-900 mb-3 border-t pt-4">Address</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
              <InfoItem label="Street" value={profile.address?.street} />
              <InfoItem label="City" value={profile.address?.city} />
              <InfoItem label="State" value={profile.address?.state} />
              <InfoItem label="ZIP / Country" value={[profile.address?.zipCode, profile.address?.country].filter(Boolean).join(', ')} />
            </dl>
          </>
        )}
      </Card>

      {/* Bank & Statutory (Editable) */}
      <Card>
        <SectionHeader title="Banking & Statutory Information" section="bank" />
        {editSection === 'bank' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
              <Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
              <Input label="IFSC Code" name="ifsc" value={formData.ifsc} onChange={handleChange} />
              <Input label="PAN Number" name="pan" value={formData.pan} onChange={handleChange} />
              <Input label="UAN Number" name="uan" value={formData.uan} onChange={handleChange} />
            </div>
            <SectionFooter section="bank" />
          </>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-6">
            <InfoItem label="Bank Name" value={profile.bankDetails?.bankName || profile.bankName} />
            <InfoItem label="Account Number" value={profile.bankDetails?.accountNumber || profile.accountNumber} />
            <InfoItem label="IFSC Code" value={profile.bankDetails?.ifsc || profile.ifsc} />
            <InfoItem label="PAN Number" value={profile.statutory?.pan || profile.pan} />
            <InfoItem label="UAN Number" value={profile.statutory?.uan || profile.uan} />
          </dl>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
