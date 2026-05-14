import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function EmailVerificationPending() {
  const location = useLocation();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  const email = location.state?.email || '';
  const message = location.state?.message || 'Please check your email to verify your account';
  const verificationUrl = location.state?.verificationUrl || '';

  // Debug logging
  console.log('EmailVerificationPending - State:', {
    email,
    message,
    verificationUrl,
    fullState: location.state
  });

  const handleVerifyClick = () => {
    if (verificationUrl) {
      // Extract the path from the full URL
      // e.g., "http://localhost:5173/verify-email/token" -> "/verify-email/token"
      const url = new URL(verificationUrl);
      const path = url.pathname;
      console.log('Navigating to:', path);
      navigate(path);
    } else {
      console.error('No verification URL available');
    }
  };

  if (!email) {
    // If no email in state, redirect to signup
    setTimeout(() => navigate('/signup'), 100);
    return null;
  }

  const handleResendEmail = async () => {
    setResending(true);
    setError('');
    setResendSuccess(false);

    try {
      const response = await axios.post(`${API_BASE_URL}/registration/resend-verification`, {
        email,
      });

      if (response.data.success) {
        setResendSuccess(true);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to resend email. Please try again.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-xl p-4 shadow-sm mb-4">
            <img
              src="/images/AuroraHR_logo.svg?v=20260514b"
              alt="AuroraHR"
              className="h-12 w-auto"
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
            <EnvelopeIcon className="h-10 w-10 text-primary-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">{message}</p>

          {/* Email Display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Email sent to:</p>
            <p className="text-base font-semibold text-gray-900">{email}</p>
          </div>

          {/* Success/Error Messages */}
          {resendSuccess && (
            <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
              <div className="flex items-center text-success-800">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <p className="text-sm">Verification email sent successfully!</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-danger-50 border border-danger-200 rounded-lg p-4">
              <p className="text-sm text-danger-800">{error}</p>
            </div>
          )}

          {/* Development Mode - Show verification link */}
          {verificationUrl && (
            <div className="mb-6 bg-warning-50 border-2 border-warning-300 rounded-lg p-4">
              <div className="flex items-start mb-2">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-warning-900 mb-1">
                    Development Mode - Email Not Configured
                  </h3>
                  <p className="text-xs text-warning-800 mb-3">
                    SMTP is not configured. Click the button below to verify your email:
                  </p>
                  <button
                    onClick={handleVerifyClick}
                    className="w-full btn btn-primary btn-sm"
                  >
                    ✓ Verify Email & Continue Setup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!verificationUrl && (
            <div className="text-left mb-6 space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-xs">
                    1
                  </div>
                </div>
                <p className="ml-3 text-sm text-gray-600">
                  Check your inbox for an email from AuroraHR
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-xs">
                    2
                  </div>
                </div>
                <p className="ml-3 text-sm text-gray-600">
                  Click the verification link in the email
                </p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-xs">
                    3
                  </div>
                </div>
                <p className="ml-3 text-sm text-gray-600">
                  Complete your account setup with a password
                </p>
              </div>
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResendEmail}
            disabled={resending || resendSuccess}
            className="w-full btn btn-outline btn-primary mb-4 inline-flex items-center justify-center"
          >
            {resending ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Resend Verification Email
              </>
            )}
          </button>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-2">
            <p>
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={handleResendEmail}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                resend
              </button>
            </p>
            <p>
              Wrong email?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Try again
              </button>
            </p>
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
