import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { HiOutlineLockClosed } from 'react-icons/hi';

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, and a number');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      if (response.success) {
        toast.success('Password changed successfully');
        if (user.isFirstLogin) {
          updateUser({ isFirstLogin: false });
          navigate(user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
        } else {
          // If not first login, stay on page or navigate to profile
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Change Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          {user?.isFirstLogin && (
            <div className="mb-4 bg-warning-50 border-l-4 border-warning-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-warning-700">
                    Please change your temporary password to continue.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="currentPassword"
              type="password"
              label="Current Password"
              icon={HiOutlineLockClosed}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              id="newPassword"
              type="password"
              label="New Password"
              icon={HiOutlineLockClosed}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <div className="text-xs text-gray-500 -mt-4">
              Strength: {newPassword.length > 8 ? 'Strong' : newPassword.length > 5 ? 'Medium' : 'Weak'}
            </div>
            <Input
              id="confirmPassword"
              type="password"
              label="Confirm New Password"
              icon={HiOutlineLockClosed}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            <div className="flex items-center justify-between mt-6">
              <Button type="button" variant="ghost" onClick={logout}>
                Logout
              </Button>
              <Button type="submit" loading={loading}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
