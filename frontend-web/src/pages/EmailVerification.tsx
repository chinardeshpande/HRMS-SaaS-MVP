import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function EmailVerification() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [registrationId, setRegistrationId] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/registration/verify-email`, {
        token,
      });

      if (response.data.success) {
        setStatus('success');
        setMessage('Email verified successfully!');
        setRegistrationId(response.data.data.registrationId);

        // Redirect to password creation after 2 seconds
        setTimeout(() => {
          navigate(`/create-password?registrationId=${response.data.data.registrationId}`);
        }, 2000);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(
        err.response?.data?.error?.message ||
          'Email verification failed. The link may have expired.'
      );
    }
  };

  const handleResendEmail = async () => {
    // You would need to implement a way to get the email
    // For now, we'll just show a message
    setMessage('Please contact support to resend verification email.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/images/aurorahr-logo-primary.svg"
            alt="AuroraHR - Illuminate The Journey | Grow Every Person"
            className="h-20 w-auto mx-auto"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {status === 'loading' && (
              <div>
                <ArrowPathIcon className="h-16 w-16 text-blue-600 mx-auto animate-spin mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Verifying Your Email
                </h2>
                <p className="text-gray-600">Please wait while we verify your email address...</p>
              </div>
            )}

            {status === 'success' && (
              <div>
                <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircleIcon className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Verified Successfully!
                </h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Redirecting you to create your password...
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div>
                <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <XCircleIcon className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Verification Failed
                </h2>
                <p className="text-gray-600 mb-6">{message}</p>

                <div className="space-y-3">
                  <button
                    onClick={handleResendEmail}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Resend Verification Email
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          Need help?{' '}
          <a href="mailto:support@aurorahr.in" className="text-blue-600 hover:underline">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
