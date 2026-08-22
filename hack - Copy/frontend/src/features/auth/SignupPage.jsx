import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signup } from '../../services/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { HiOutlineSparkles, HiOutlineCamera, HiOutlineUser } from 'react-icons/hi2';

const SignupPage = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    role: 'employee',
    phone: '',
    department: '',
    designation: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      newErrors.password = 'Must contain uppercase, lowercase, and number';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleProfilePicture = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Only JPEG, PNG, and WebP images are allowed');
        return;
      }
      setProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      if (formData.employeeId) submitData.append('employeeId', formData.employeeId);
      if (formData.phone) submitData.append('phone', formData.phone);
      if (formData.department) submitData.append('department', formData.department);
      if (formData.designation) submitData.append('designation', formData.designation);
      if (profileFile) submitData.append('profilePicture', profileFile);

      const response = await signup(submitData);
      
      // Auto-login after signup
      const { token, user } = response.data;
      localStorage.setItem('dayflow_token', token);
      localStorage.setItem('dayflow_user', JSON.stringify(user));
      
      toast.success('Account created successfully! Welcome to Dayflow.');
      
      // Redirect based on role
      if (user.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/employee/dashboard';
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    { value: '', label: 'Select Department' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'HR', label: 'HR' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Operations', label: 'Operations' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl mb-3">
            <HiOutlineSparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-primary-200 mt-1">Join Dayflow HRMS</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Profile Picture */}
            <div className="flex justify-center">
              <div className="relative">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-gray-100 border-3 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all overflow-hidden"
                >
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <HiOutlineUser className="w-8 h-8 text-gray-400 mx-auto" />
                      <span className="text-xs text-gray-400 mt-1">Photo</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 shadow-lg"
                >
                  <HiOutlineCamera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfilePicture}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                placeholder="John"
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
              />
            </div>

            {/* Email & Employee ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="john@company.com"
              />
              <Input
                label="Employee ID"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="EMP-0001 (auto-generated if empty)"
              />
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password *"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Min 8 chars, A-Z, a-z, 0-9"
              />
              <Input
                label="Confirm Password *"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Re-enter password"
              />
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[
                    formData.password.length >= 8,
                    /[A-Z]/.test(formData.password),
                    /[a-z]/.test(formData.password),
                    /\d/.test(formData.password),
                  ].map((met, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${met ? 'bg-green-500' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className={formData.password.length >= 8 ? 'text-green-600' : ''}>8+ chars</span>
                  <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>Uppercase</span>
                  <span className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>Lowercase</span>
                  <span className={/\d/.test(formData.password) ? 'text-green-600' : ''}>Number</span>
                </div>
              </div>
            )}

            {/* Department */}
            <Select
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={departments}
            />

            {/* Phone & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />
              <Input
                label="Designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g. Software Developer"
              />
            </div>

            {/* Submit */}
            <Button type="submit" variant="primary" fullWidth loading={loading} size="lg">
              Create Account
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-5 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
