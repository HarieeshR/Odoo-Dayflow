import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import * as authService from '../../services/authService';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { HiOutlineMail } from 'react-icons/hi';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setSubmitted(true);
      if (res?.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
      toast.success('If that email exists, a reset token was generated');
    } catch (err) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 mb-4">
                <svg className="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
              <p className="mt-2 text-sm text-gray-500 mb-6">
                If an account with that email exists, a reset link has been sent.
              </p>
              {resetToken && (
                <div className="mb-6 text-left bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500 mb-2">Development reset token:</p>
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="text-sm font-medium text-primary-600 break-all"
                  >
                    Continue to reset password
                  </Link>
                </div>
              )}
              <Link to="/login">
                <Button fullWidth>Return to login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-gray-500 mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <Input
                id="email"
                type="email"
                label="Email address"
                icon={HiOutlineMail}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <Button type="submit" fullWidth loading={loading}>
                Send Reset Link
              </Button>
              
              <div className="text-center mt-4">
                <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
