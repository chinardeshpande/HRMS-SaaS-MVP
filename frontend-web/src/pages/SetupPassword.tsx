import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import registrationService from '../services/registrationService';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function SetupPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const registrationId = location.state?.registrationId || sessionStorage.getItem('registration_id') || '';
  const email = location.state?.email || sessionStorage.getItem('signup_email') || '';

  // Password strength criteria
  const passwordCriteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passwordStrength = Object.values(passwordCriteria).filter(Boolean).length;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return { text: 'Weak', color: 'text-red-600', bg: 'bg-red-600' };
    if (passwordStrength <= 3) return { text: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-600' };
    if (passwordStrength <= 4) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-600' };
    return { text: 'Strong', color: 'text-green-600', bg: 'bg-green-600' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!registrationId) {
      setError('Invalid registration. Please start the signup process again.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordStrength < 3) {
      setError('Please choose a stronger password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await registrationService.completeRegistration(registrationId, password);

      // Store authentication tokens
      localStorage.setItem('tokens', JSON.stringify({
        token: result.token,
        refreshToken: result.refreshToken,
      }));

      localStorage.setItem('user', JSON.stringify(result.user));

      // Clear session storage
      sessionStorage.removeItem('signup_email');
      sessionStorage.removeItem('signup_company');
      sessionStorage.removeItem('registration_id');

      // Navigate to welcome page
      navigate('/welcome', {
        state: {
          isNewUser: true,
          tenantId: result.tenantId,
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthIndicator = getPasswordStrengthText();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-4">
            <SparklesIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Aura</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-3">
              <LockClosedIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Set Your Password
            </h2>
            <p className="text-gray-600">
              Create a strong password for {email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${strengthIndicator.color}`}>
                      {strengthIndicator.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${strengthIndicator.bg}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12 ${
                    confirmPassword && !passwordsMatch ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
              <div className="space-y-1">
                {[
                  { label: 'At least 8 characters', met: passwordCriteria.length },
                  { label: 'One uppercase letter', met: passwordCriteria.uppercase },
                  { label: 'One lowercase letter', met: passwordCriteria.lowercase },
                  { label: 'One number', met: passwordCriteria.number },
                  { label: 'One special character', met: passwordCriteria.special },
                ].map((req, idx) => (
                  <div key={idx} className="flex items-center text-xs">
                    {req.met ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-gray-300 mr-2" />
                    )}
                    <span className={req.met ? 'text-green-700' : 'text-gray-500'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !passwordsMatch || passwordStrength < 3}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up your account...' : 'Complete Setup'}
            </button>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="mailto:support@aurahrms.com" className="text-purple-600 hover:text-purple-700 font-medium">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
