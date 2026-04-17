import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  RocketLaunchIcon,
  UsersIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ChartBarIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const features = [
    {
      icon: UsersIcon,
      title: 'Employee Management',
      description: 'Add and manage your employees',
      action: 'Add Employees',
      link: '/employees',
    },
    {
      icon: CalendarDaysIcon,
      title: 'Attendance & Leave',
      description: 'Track attendance and manage leaves',
      action: 'View Attendance',
      link: '/attendance',
    },
    {
      icon: DocumentTextIcon,
      title: 'Onboarding',
      description: 'Streamline new hire onboarding',
      action: 'Start Onboarding',
      link: '/onboarding',
    },
    {
      icon: ChartBarIcon,
      title: 'Reports & Analytics',
      description: 'Insights into your workforce',
      action: 'View Reports',
      link: '/reports',
    },
  ];

  const quickSteps = [
    { text: 'Add your company departments', done: false },
    { text: 'Invite or add employees', done: false },
    { text: 'Configure leave policies', done: false },
    { text: 'Set up attendance tracking', done: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AuroraHR</h1>
              <p className="text-xs text-gray-500">Welcome aboard!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 mb-6 animate-bounce">
            <RocketLaunchIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Welcome to AuroraHR!
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Your HRMS workspace is ready to go
          </p>
          <p className="text-gray-500">
            Logged in as <span className="font-medium text-gray-900">{user?.email}</span>
          </p>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Your account is all set up!
              </h3>
              <p className="text-gray-600 mb-4">
                You'll be redirected to your dashboard in <span className="font-bold text-purple-600">{countdown}</span> seconds
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Go to Dashboard Now
              </button>
            </div>
          </div>
        </div>

        {/* Quick Steps */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            🚀 Quick Start Guide
          </h3>
          <div className="space-y-3">
            {quickSteps.map((step, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">{idx + 1}</span>
                </div>
                <span className="text-gray-700">{step.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
            Explore Key Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => navigate(feature.link)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center group-hover:from-purple-200 group-hover:to-blue-200 transition-all">
                      <feature.icon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                    <span className="text-sm text-purple-600 font-medium group-hover:text-purple-700">
                      {feature.action} →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-2">Need Help Getting Started?</h3>
            <p className="mb-4 opacity-90">
              Our support team is here to help you make the most of AuroraHR
            </p>
            <div className="flex items-center justify-center space-x-4">
              <a
                href="mailto:support@aurorahr.in"
                className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all"
              >
                Contact Support
              </a>
              <button className="border-2 border-white text-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-purple-600 transition-all">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
