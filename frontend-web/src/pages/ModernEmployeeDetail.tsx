import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import employeeService from '../services/employeeService';
import {
  ArrowLeftIcon,
  PencilIcon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  BriefcaseIcon,
  ClockIcon as HistoryIcon,
  CheckCircleIcon,
  StarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface HistoryEvent {
  id: string;
  type: 'joining' | 'promotion' | 'transfer' | 'salary_increase' | 'performance_review' | 'probation_end';
  date: string;
  title: string;
  description: string;
  details?: {
    from?: string;
    to?: string;
    amount?: number;
    rating?: string;
  };
}

interface EmployeeDetail {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  positionId?: string;
  positionTitle?: string;
  jobTitle?: string;
  departmentName?: string;
  reportsToEmployeeName?: string;
  status: 'active' | 'inactive' | 'exited';
  dateOfJoining: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  employeeType?: string;
  workLocation?: string;
  salary?: number;
  currency?: string;
  employmentType?: string;
  probationEndDate?: string;
  lastPromotionDate?: string;
  yearsOfExperience?: number;
  organizationalHistory?: HistoryEvent[];
  department?: {
    departmentId: string;
    name: string;
  };
  designation?: {
    designationId: string;
    title: string;
  };
  manager?: {
    employeeId: string;
    firstName: string;
    lastName: string;
  };
}

export default function ModernEmployeeDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'history'>('personal');
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate organizational history based on employee data
  const generateOrganizationalHistory = (employee: any): HistoryEvent[] => {
    const history: HistoryEvent[] = [];
    const joinDate = new Date(employee.dateOfJoining);
    const now = new Date();
    const monthsSinceJoining = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());

    // Joining event
    history.push({
      id: '1',
      type: 'joining',
      date: employee.dateOfJoining,
      title: 'Joined Company',
      description: `Started as ${employee.designation?.title || 'Employee'} in ${employee.department?.name || 'the company'}`,
      details: { to: employee.designation?.title || 'Employee' },
    });

    // Probation end (6 months after joining)
    if (monthsSinceJoining >= 6) {
      const probationEndDate = new Date(joinDate);
      probationEndDate.setMonth(probationEndDate.getMonth() + 6);
      history.push({
        id: '2',
        type: 'probation_end',
        date: probationEndDate.toISOString().split('T')[0],
        title: 'Probation Completed',
        description: 'Successfully completed 6-month probation period',
      });
    }

    // Performance reviews (every 6 months)
    let reviewCount = 0;
    for (let i = 12; i <= monthsSinceJoining; i += 6) {
      reviewCount++;
      const reviewDate = new Date(joinDate);
      reviewDate.setMonth(reviewDate.getMonth() + i);

      const ratings = ['Meets Expectations', 'Exceeds Expectations', 'Outstanding'];
      const rating = ratings[Math.min(reviewCount - 1, 2)];

      history.push({
        id: `review-${reviewCount}`,
        type: 'performance_review',
        date: reviewDate.toISOString().split('T')[0],
        title: reviewCount % 2 === 0 ? 'Annual Performance Review' : 'Mid-Year Performance Review',
        description: `Demonstrated strong performance and contribution to team goals`,
        details: { rating },
      });
    }

    // Salary increase (annually)
    for (let i = 12; i <= monthsSinceJoining; i += 12) {
      const raiseDate = new Date(joinDate);
      raiseDate.setMonth(raiseDate.getMonth() + i);

      history.push({
        id: `salary-${i}`,
        type: 'salary_increase',
        date: raiseDate.toISOString().split('T')[0],
        title: 'Annual Salary Review',
        description: 'Salary increased based on performance',
        details: { amount: 5 + Math.floor(Math.random() * 10) },
      });
    }

    // Promotion (every 18-24 months for good performers)
    if (monthsSinceJoining >= 18) {
      const promotionDate = new Date(joinDate);
      promotionDate.setMonth(promotionDate.getMonth() + 18);

      history.push({
        id: 'promotion-1',
        type: 'promotion',
        date: promotionDate.toISOString().split('T')[0],
        title: `Promoted to Senior ${employee.designation?.title || 'Position'}`,
        description: 'Promoted for exceptional performance and leadership',
        details: {
          from: employee.designation?.title || 'Previous Position',
          to: `Senior ${employee.designation?.title || 'Position'}`,
        },
      });
    }

    // Sort by date
    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Fetch employee data on mount
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) {
        navigate('/employees');
        return;
      }

      try {
        setLoading(true);
        const data = await employeeService.getById(id);

        // Map API data to component structure
        const mappedEmployee: EmployeeDetail = {
          ...data,
          positionTitle: data.designation?.title,
          jobTitle: data.designation?.title,
          departmentName: data.department?.name,
          reportsToEmployeeName: data.manager
            ? `${data.manager.firstName} ${data.manager.lastName}`
            : undefined,
          // Generate organizational history based on employee data
          organizationalHistory: generateOrganizationalHistory(data),
        };

        setEmployee(mappedEmployee);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching employee:', err);
        setError('Failed to load employee details');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, navigate]);

  // Loading state
  if (loading) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600 mb-4"></div>
            <p className="text-gray-600">Loading employee details...</p>
          </div>
        </div>
      </ModernLayout>
    );
  }

  // Error state
  if (error || !employee) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The employee you are looking for does not exist.'}</p>
            <button onClick={() => navigate('/employees')} className="btn btn-primary">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Employees
            </button>
          </div>
        </div>
      </ModernLayout>
    );
  }

  const handleBack = () => {
    navigate('/employees');
  };

  const handleEdit = () => {
    navigate('/edit-profile', { state: { employee } });
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'promotion':
        navigate('/promote', { state: { employee } });
        break;
      case 'transfer':
        navigate('/transfer', { state: { employee } });
        break;
      case 'compensation':
        navigate('/compensation', { state: { employee } });
        break;
      case 'performance':
        navigate('/performance-review', { state: { employee } });
        break;
      case 'attendance':
        navigate('/employee-attendance', { state: { employee } });
        break;
      default:
        console.log(`Unknown action: ${action}`);
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'badge-success',
      inactive: 'badge-warning',
      'on-leave': 'badge-warning',
      exited: 'badge-danger',
    };
    return badges[status as keyof typeof badges] || 'badge-gray';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const calculateTenure = (dateOfJoining: string) => {
    const joinDate = new Date(dateOfJoining);
    const now = new Date();
    const years = now.getFullYear() - joinDate.getFullYear();
    const months = now.getMonth() - joinDate.getMonth();
    const totalMonths = years * 12 + months;
    if (totalMonths < 12) return `${totalMonths}m`;
    return `${Math.floor(totalMonths / 12)}y ${totalMonths % 12}m`;
  };

  const InfoItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value || 'N/A'}</p>
    </div>
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'joining':
        return <SparklesIcon className="h-5 w-5" />;
      case 'promotion':
        return <ArrowTrendingUpIcon className="h-5 w-5" />;
      case 'transfer':
        return <ArrowsRightLeftIcon className="h-5 w-5" />;
      case 'salary_increase':
        return <BanknotesIcon className="h-5 w-5" />;
      case 'performance_review':
        return <StarIcon className="h-5 w-5" />;
      case 'probation_end':
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return <HistoryIcon className="h-5 w-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'joining':
        return 'success';
      case 'promotion':
        return 'primary';
      case 'transfer':
        return 'purple';
      case 'salary_increase':
        return 'success';
      case 'performance_review':
        return 'warning';
      case 'probation_end':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <ModernLayout>
      <button onClick={handleBack} className="btn btn-secondary mb-4">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back
      </button>

      {/* Compact Header Card */}
      <div className="card mb-4 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center shadow-lg">
              {employee.photoUrl ? (
                <img src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white">{getInitials(employee.firstName, employee.lastName)}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{employee.firstName} {employee.lastName}</h1>
              <p className="text-white/90 text-sm font-medium">{employee.positionTitle} • {employee.departmentName}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="badge bg-white/95 text-primary-700 font-semibold text-xs px-3 py-1">{employee.employeeCode}</span>
              <span className={`badge ${getStatusBadge(employee.status)} text-xs px-3 py-1`}>{employee.status.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Compact Stats Row */}
        <div className="grid grid-cols-4 divide-x divide-gray-200 bg-gray-50">
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-gray-600 font-semibold mb-1">TENURE</p>
            <p className="text-lg font-bold text-primary-600">{calculateTenure(employee.dateOfJoining)}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-gray-600 font-semibold mb-1">EXPERIENCE</p>
            <p className="text-lg font-bold text-primary-600">{employee.yearsOfExperience || 'N/A'}y</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-gray-600 font-semibold mb-1">TYPE</p>
            <p className="text-sm font-bold text-primary-600">{employee.employmentType || 'Full-time'}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-gray-600 font-semibold mb-1">LOCATION</p>
            <p className="text-sm font-bold text-primary-600">{employee.workLocation || 'Remote'}</p>
          </div>
        </div>
      </div>

      {/* Tabs & Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'personal'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserIcon className="h-4 w-4 mr-1.5" />
            Personal
          </button>
          <button
            onClick={() => setActiveTab('professional')}
            className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'professional'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BriefcaseIcon className="h-4 w-4 mr-1.5" />
            Professional
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'history'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HistoryIcon className="h-4 w-4 mr-1.5" />
            History
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <button onClick={handleEdit} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button onClick={() => handleAction('promotion')} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Promote">
            <ArrowTrendingUpIcon className="h-4 w-4" />
          </button>
          <button onClick={() => handleAction('transfer')} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Transfer">
            <ArrowsRightLeftIcon className="h-4 w-4" />
          </button>
          <button onClick={() => handleAction('compensation')} className="p-2 text-gray-500 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors" title="Compensation">
            <BanknotesIcon className="h-4 w-4" />
          </button>
          <button onClick={() => handleAction('performance')} className="p-2 text-gray-500 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors" title="Performance">
            <ChartBarIcon className="h-4 w-4" />
          </button>
          <button onClick={() => handleAction('attendance')} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Attendance">
            <ClockIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card">
        <div className="card-body p-6">

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              {/* Contact Details */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">📧</span>
                  Contact Details
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <InfoItem label="Email" value={employee.email} />
                  <InfoItem label="Phone" value={employee.phone} />
                  <InfoItem label="Address" value={employee.address} />
                </div>
              </div>

              {/* Personal Details */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-3 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs mr-2">👤</span>
                  Personal Details
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <InfoItem label="Date of Birth" value={employee.dateOfBirth} />
                  <InfoItem label="Gender" value={employee.gender} />
                  <InfoItem label="Marital Status" value={employee.maritalStatus} />
                  <InfoItem label="Nationality" value={employee.nationality} />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <h3 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs mr-2">🆘</span>
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Contact Name" value={employee.emergencyContact} />
                  <InfoItem label="Phone" value={employee.emergencyPhone} />
                </div>
              </div>
            </div>
          )}

          {/* Professional Info Tab */}
          {activeTab === 'professional' && (
            <div className="space-y-4">
              {/* Position & Hierarchy */}
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-3 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs mr-2">🏢</span>
                  Position & Hierarchy
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <InfoItem label="Position" value={employee.positionTitle} />
                  <InfoItem label="Job Title" value={employee.jobTitle} />
                  <InfoItem label="Department" value={employee.departmentName} />
                  <InfoItem label="Reports To" value={employee.reportsToEmployeeName || 'No manager'} />
                </div>
              </div>

              {/* Employment Details */}
              <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-100">
                <h3 className="text-xs font-bold text-cyan-700 uppercase tracking-wide mb-3 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs mr-2">📋</span>
                  Employment Details
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <InfoItem label="Type" value={employee.employmentType || 'Full-time'} />
                  <InfoItem label="Location" value={employee.workLocation} />
                  <InfoItem label="Joining Date" value={employee.dateOfJoining} />
                  <InfoItem label="Experience" value={employee.yearsOfExperience ? `${employee.yearsOfExperience} years` : undefined} />
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                    <span className={`badge ${getStatusBadge(employee.status)}`}>{employee.status.toUpperCase()}</span>
                  </div>
                  <InfoItem label="Probation End" value={employee.probationEndDate || 'Confirmed'} />
                </div>
              </div>

              {/* Compensation */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h3 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs mr-2">💰</span>
                  Compensation
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Annual Salary</p>
                    <p className="text-2xl font-bold text-success-600">
                      {employee.salary ? `${employee.currency || '$'}${employee.salary.toLocaleString()}` : 'Confidential'}
                    </p>
                  </div>
                  <InfoItem label="Last Promotion" value={employee.lastPromotionDate || 'No history'} />
                </div>
              </div>
            </div>
          )}

          {/* Organizational History Tab */}
          {activeTab === 'history' && (
            <div>
              {employee.organizationalHistory && employee.organizationalHistory.length > 0 ? (
                <div className="overflow-x-auto pb-4 relative">
                  {/* Horizontal Timeline Line */}
                  <div className="absolute left-0 right-0 top-28 h-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full mx-6 z-0"></div>

                  <div className="flex gap-6 px-6 pt-4 relative z-10">

                    {/* Timeline Events */}
                    {employee.organizationalHistory
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((event, index) => {
                        const colorClass = getEventColor(event.type);
                        const bgColorMap = {
                          primary: 'bg-primary-600',
                          success: 'bg-success-600',
                          warning: 'bg-warning-600',
                          purple: 'bg-purple-600',
                        };
                        const borderColorMap = {
                          primary: 'border-primary-600',
                          success: 'border-success-600',
                          warning: 'border-warning-600',
                          purple: 'border-purple-600',
                        };
                        const bgColor = bgColorMap[colorClass as keyof typeof bgColorMap];
                        const borderColor = borderColorMap[colorClass as keyof typeof borderColorMap];

                        return (
                          <div key={event.id} className="relative flex flex-col items-center min-w-[320px] max-w-[320px]">
                            {/* Date Badge at Top */}
                            <div className={`mb-6 px-4 py-2 rounded-xl ${bgColor} text-white font-bold text-sm shadow-lg min-w-[200px] text-center`}>
                              {new Date(event.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>

                            {/* Timeline Dot */}
                            <div className={`w-12 h-12 rounded-full bg-white border-4 ${borderColor} flex items-center justify-center shadow-lg z-10 mb-4 text-${colorClass}-600`}>
                              {getEventIcon(event.type)}
                            </div>

                            {/* Event Card */}
                            <div className={`card border-2 ${borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 w-full h-56`}>
                              <div className="card-body p-4">
                                {/* Icon Badge */}
                                <div className="flex items-center gap-2 mb-3">
                                  <div className={`w-8 h-8 rounded-lg ${bgColor} bg-opacity-20 flex items-center justify-center text-${colorClass}-600`}>
                                    {getEventIcon(event.type)}
                                  </div>
                                  <h4 className={`font-bold text-sm text-${colorClass}-600`}>{event.title}</h4>
                                </div>

                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{event.description}</p>

                                {/* Event Details */}
                                {event.details && (
                                  <div className="space-y-2">
                                    {event.details.from && event.details.to && (
                                      <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-${colorClass}-50 border border-${colorClass}-200`}>
                                        <span className="text-xs font-semibold text-gray-600">{event.details.from}</span>
                                        <div className={`w-6 h-6 rounded-full ${bgColor} flex items-center justify-center text-white text-xs font-bold`}>
                                          →
                                        </div>
                                        <span className={`text-xs font-bold text-${colorClass}-600`}>{event.details.to}</span>
                                      </div>
                                    )}
                                    <div className="flex gap-2 justify-center">
                                      {event.details.amount && (
                                        <span className="badge badge-success">+{event.details.amount}%</span>
                                      )}
                                      {event.details.rating && (
                                        <span className="badge badge-warning flex items-center gap-1">
                                          <StarIcon className="h-3 w-3" />
                                          {event.details.rating}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <HistoryIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">No History Available</h3>
                  <p className="text-sm text-gray-400">Organizational history will appear here as events occur</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}
