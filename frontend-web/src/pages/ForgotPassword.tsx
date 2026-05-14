import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
      setMessage(
        response.data?.message || 'If an active account exists for this email, a reset link will be sent.'
      );
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Unable to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/images/AuroraHR_logo.svg?v=20260514b"
            alt="AuroraHR - Illuminate The Journey | Grow Every Person"
            className="mx-auto h-16 w-auto"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset password</h1>
            <p className="text-gray-500">Enter your work email and we will send a secure reset link.</p>
          </div>

          {message && (
            <div className="mb-6 rounded-lg border border-success-200 bg-success-50 p-4">
              <p className="text-sm text-success-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-danger-200 bg-danger-50 p-4">
              <p className="text-sm text-danger-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="input pl-10 block w-full"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
