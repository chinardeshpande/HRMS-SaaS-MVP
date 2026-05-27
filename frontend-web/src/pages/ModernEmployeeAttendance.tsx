import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import attendanceService from '../services/attendanceService';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday' | 'weekend';
  workMinutes: number;
  isLate: boolean;
  lateMinutes: number;
}

export default function ModernEmployeeAttendance() {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee;

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    avgWorkHours: 0,
  });

  useEffect(() => {
    if (!employee) {
      navigate('/employees');
      return;
    }
    fetchAttendance();
  }, [employee, selectedMonth, navigate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      const attendance = await attendanceService.getCompanyWide(startDate, endDate);
      const records: AttendanceRecord[] = attendance
        .filter((record) => record.employeeId === employee.employeeId)
        .map((record) => ({
          id: record.attendanceId,
          date: String(record.date).split('T')[0],
          checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
          checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
          status: record.status,
          workMinutes: Number(record.workMinutes || 0),
          isLate: Boolean(record.isLate),
          lateMinutes: Number(record.lateMinutes || 0),
        }));

      const presentCount = records.filter((record) => record.status === 'present').length;
      const absentCount = records.filter((record) => record.status === 'absent').length;
      const lateCount = records.filter((record) => record.isLate).length;
      const totalWorkMinutes = records.reduce((sum, record) => sum + record.workMinutes, 0);

      setAttendanceRecords(records);
      setStats({
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalLate: lateCount,
        avgWorkHours: records.length > 0 ? totalWorkMinutes / records.length / 60 : 0,
      });
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const badges = {
      present: 'badge-success',
      absent: 'badge-danger',
      half_day: 'badge-warning',
      on_leave: 'badge-warning',
      holiday: 'badge-gray',
      weekend: 'badge-gray',
    };
    return badges[status] || 'badge-gray';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!employee) return null;

  return (
    <ModernLayout>
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(`/employees/${employee.employeeId}`)} className="btn btn-secondary mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-600 mt-1">{employee.firstName} {employee.lastName}</p>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input input-sm"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="card border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-700">PRESENT</p>
                  <p className="text-2xl font-bold text-success-600">{stats.totalPresent}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-red-700">ABSENT</p>
                  <p className="text-2xl font-bold text-danger-600">{stats.totalAbsent}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                  <span className="text-xl">❌</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-orange-700">LATE</p>
                  <p className="text-2xl font-bold text-warning-600">{stats.totalLate}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                  <span className="text-xl">⏰</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-700">AVG HOURS</p>
                  <p className="text-2xl font-bold text-primary-600">{stats.avgWorkHours.toFixed(1)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="card">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Day</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Check In</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Check Out</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Work Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Late</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${getStatusBadge(record.status)} text-xs`}>
                            {record.status.toUpperCase().replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{record.checkIn || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{record.checkOut || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.workMinutes > 0 ? formatDuration(record.workMinutes) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {record.isLate ? (
                            <span className="text-danger-600 font-medium">+{record.lateMinutes}m</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
