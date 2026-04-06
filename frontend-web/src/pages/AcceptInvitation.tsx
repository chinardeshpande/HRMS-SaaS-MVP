import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  EnvelopeIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface InvitationData {
  email: string;
  fullName: string;
  role: string;
  status: string;
  isValid: boolean;
}

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    verifyInvitation();
  }, [token]);

  useEffect(() => {
    calculatePasswordStrength(formData.password);
  }, [formData.password]);

  const verifyInvitation = async () => {
    try {
      setLoading(true);
      console.log('🔍 Verifying invitation token:', token);
      const response = await api.get(`/invitations/verify/${token}`);
      console.log('✅ Invitation response:', response);

      if (response.success) {
        setInvitation(response.data);
        console.log('📝 Invitation data:', response.data);

        if (!response.data.isValid) {
          console.log('❌ Invitation not valid');
          setError('This invitation is no longer valid or has already been used.');
        } else {
          console.log('✅ Invitation is valid');
        }
      }
    } catch (err: any) {
      console.error('❌ Error verifying invitation:', err);
      setError(err.response?.data?.error?.message || 'Invalid or expired invitation link');
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    setPasswordStrength(Math.min(strength, 100));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Fair';
    return 'Strong';
  };

  const validateForm = (): boolean => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (passwordStrength < 40) {
      setError('Please choose a stronger password');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/invitations/accept/${token}`, {
        password: formData.password,
      });

      if (response.success) {
        // Store the authentication token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);

        setSuccess(true);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircleIcon className="w-16 h-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome aboard!</h2>
          <p className="text-gray-600">
            Your account has been created successfully. Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 rounded-full p-3">
              <ExclamationCircleIcon className="w-16 h-16 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!invitation?.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 rounded-full p-3">
              <ExclamationCircleIcon className="w-16 h-16 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Expired</h2>
          <p className="text-gray-600 mb-6">
            This invitation has expired or has already been used. Please contact your administrator for a new invitation.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <BuildingOfficeIcon className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
          <p className="text-purple-100">Set up your account to get started</p>
        </div>

        {/* Invitation Details */}
        <div className="bg-gray-50 p-6 border-b">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium">{invitation.fullName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <EnvelopeIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{invitation.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <LockClosedIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Role: {invitation.role}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Create Your Password</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Password strength:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength < 40 ? 'text-red-600' :
                    passwordStrength < 70 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use 8+ characters with a mix of letters, numbers & symbols
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !formData.password || !formData.confirmPassword}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Account...
              </span>
            ) : (
              'Create Account & Continue'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
