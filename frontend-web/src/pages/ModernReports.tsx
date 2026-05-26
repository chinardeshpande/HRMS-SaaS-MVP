import { useState } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import {
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  TrophyIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: typeof ChartBarIcon;
  endpoint: string;
  color: string;
  requiresDateRange?: boolean;
}

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'headcount',
    title: 'Headcount Report',
    description: 'Current workforce distribution by department, employment type, and status',
    icon: UsersIcon,
    endpoint: '/reports/headcount',
    color: 'blue',
  },
  {
    id: 'attendance',
    title: 'Attendance Summary',
    description: 'Employee attendance patterns and statistics',
    icon: CalendarIcon,
    endpoint: '/reports/attendance-summary',
    color: 'green',
    requiresDateRange: true,
  },
  {
    id: 'leave',
    title: 'Leave Balance',
    description: 'Leave entitlements, usage, and available balances',
    icon: ClipboardDocumentCheckIcon,
    endpoint: '/reports/leave-balance',
    color: 'purple',
  },
  {
    id: 'joiners-leavers',
    title: 'Joiners & Leavers',
    description: 'Monthly movement trends and headcount changes',
    icon: UserGroupIcon,
    endpoint: '/reports/joiners-leavers',
    color: 'indigo',
    requiresDateRange: true,
  },
  {
    id: 'confirmation',
    title: 'Confirmation Due',
    description: 'Employees with probation ending soon',
    icon: DocumentTextIcon,
    endpoint: '/reports/confirmation-due',
    color: 'orange',
  },
  {
    id: 'attrition',
    title: 'Attrition Report',
    description: 'Employee turnover analysis and attrition rates',
    icon: ArrowRightOnRectangleIcon,
    endpoint: '/reports/attrition',
    color: 'red',
    requiresDateRange: true,
  },
  {
    id: 'pms',
    title: 'PMS Completion',
    description: 'Performance review completion status',
    icon: TrophyIcon,
    endpoint: '/reports/pms-completion',
    color: 'yellow',
  },
  {
    id: 'missing-docs',
    title: 'Missing Documents',
    description: 'Employees with incomplete documentation',
    icon: ClipboardDocumentCheckIcon,
    endpoint: '/reports/missing-documents',
    color: 'pink',
  },
  {
    id: 'memory-readiness',
    title: 'Memory Readiness',
    description: 'Employee, document, company record, and compensation coverage for implementation readiness',
    icon: DocumentTextIcon,
    endpoint: '/reports/memory-readiness',
    color: 'cyan',
  },
];

export default function ModernReports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsQuestion, setAnalyticsQuestion] = useState('Show headcount, attendance, leave, attrition, and performance');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsResult, setAnalyticsResult] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; hover: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', hover: 'hover:bg-blue-100', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-700', hover: 'hover:bg-green-100', border: 'border-green-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', hover: 'hover:bg-purple-100', border: 'border-purple-200' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', hover: 'hover:bg-indigo-100', border: 'border-indigo-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', hover: 'hover:bg-orange-100', border: 'border-orange-200' },
      red: { bg: 'bg-red-50', text: 'text-red-700', hover: 'hover:bg-red-100', border: 'border-red-200' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', hover: 'hover:bg-yellow-100', border: 'border-yellow-200' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-700', hover: 'hover:bg-pink-100', border: 'border-pink-200' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', hover: 'hover:bg-cyan-100', border: 'border-cyan-200' },
    };
    return colors[color] || colors.blue;
  };

  const fetchReport = async (report: ReportCard) => {
    setLoading(true);
    setError(null);
    setSelectedReport(report.id);

    try {
      let url = report.endpoint;
      if (report.requiresDateRange) {
        url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }

      const response = await api.get(url);
      setReportData(response.data);
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const runAnalyticsQuery = async () => {
    if (!analyticsQuestion.trim()) return;

    setAnalyticsLoading(true);
    setError(null);
    try {
      const response = await api.post('/analytics/query', {
        question: analyticsQuestion.trim(),
      });
      setAnalyticsResult(response.data);
    } catch (err: any) {
      console.error('Error running analytics query:', err);
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to run analytics query');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.results || reportData.results.length === 0) return;

    const headers = Object.keys(reportData.results[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.results.map((row: any) =>
        headers.map((header) => {
          const value = row[header];
          // Escape commas and quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportData.report.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'complete':
      case 'present':
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'needs_review':
      case 'inactive':
      case 'missing_attachments':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'critical':
      case 'missing':
      case 'exited':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const renderBadge = (status?: string) => (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(status)}`}>
      {(status || 'unknown').replace(/_/g, ' ')}
    </span>
  );

  const renderMemoryReadinessReport = () => {
    const summary = reportData?.summary || {};
    const results = reportData?.results || [];
    const companyFindings = reportData?.companyDocumentFindings || [];
    const summaryCards = [
      { label: 'Readiness score', value: `${summary.readinessScore ?? 0}%`, tone: 'blue' },
      { label: 'Employees', value: summary.totalEmployees ?? 0, tone: 'slate' },
      { label: 'Active', value: summary.activeEmployees ?? 0, tone: 'green' },
      { label: 'Inactive to classify', value: summary.inactiveEmployeesNeedingExitClassification ?? 0, tone: 'amber' },
      { label: 'Missing master data', value: summary.employeesWithMissingMasterData ?? 0, tone: 'red' },
      { label: 'Missing required docs', value: summary.employeesMissingRequiredDocuments ?? 0, tone: 'red' },
      { label: 'No salary structure', value: summary.employeesWithoutSalaryStructure ?? 0, tone: 'amber' },
      { label: 'No payslip records', value: summary.employeesWithoutPayslip ?? 0, tone: 'amber' },
      { label: 'Payslips without files', value: summary.payslipRecordsMissingAttachments ?? 0, tone: 'red' },
      { label: 'Company documents', value: summary.companyDocuments ?? 0, tone: 'blue' },
      { label: 'Unverified company docs', value: summary.unverifiedCompanyDocuments ?? 0, tone: 'amber' },
      { label: 'Expiring in 60 days', value: summary.expiringCompanyDocuments60Days ?? 0, tone: 'red' },
    ];
    const toneClasses: Record<string, string> = {
      blue: 'from-blue-50 to-white border-blue-100 text-blue-800',
      green: 'from-emerald-50 to-white border-emerald-100 text-emerald-800',
      amber: 'from-amber-50 to-white border-amber-100 text-amber-800',
      red: 'from-red-50 to-white border-red-100 text-red-800',
      slate: 'from-slate-50 to-white border-slate-100 text-slate-800',
    };

    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Implementation readiness</p>
              <h3 className="mt-1 text-xl font-semibold text-gray-900">{reportData.report}</h3>
              <p className="mt-2 max-w-3xl text-sm text-gray-600">
                This view checks whether tenant memory is usable: employee master completeness, documents,
                company records, compensation records, payslip file coverage, and historical employee classification.
              </p>
            </div>
            {results.length > 0 && (
              <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2 whitespace-nowrap">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className={`rounded-lg border bg-gradient-to-br p-4 ${toneClasses[card.tone]}`}>
              <p className="text-xs font-bold uppercase tracking-wide opacity-75">{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-950">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Historical employees imported as inactive are included in readiness coverage. They should be reviewed
          and converted to exited only when the HR exit/FNF evidence is confirmed.
        </div>

        {companyFindings.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900">Company document vault coverage</h4>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {companyFindings.map((finding: any) => (
                <div key={finding.category} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{String(finding.category).replace(/_/g, ' ')}</p>
                  <div className="mt-3">{renderBadge(finding.status)}</div>
                  <div className="mt-3 space-y-1 text-sm text-gray-700">
                    <p className="flex justify-between"><span>Active</span><span className="font-semibold">{finding.activeDocuments}</span></p>
                    <p className="flex justify-between"><span>Verified</span><span className="font-semibold">{finding.verifiedDocuments}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4">
              <h4 className="text-lg font-semibold text-gray-900">Employee readiness details</h4>
              <p className="mt-1 text-sm text-gray-500">Use this table as the cleanup queue for ACV data migration.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Employee',
                      'Status',
                      'Department',
                      'Designation',
                      'Master gaps',
                      'Required docs',
                      'Salary',
                      'Payslips',
                      'Files missing',
                      'Readiness',
                    ].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {results.map((row: any) => (
                    <tr key={row.employeeId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <p className="font-semibold text-gray-900">{row.employeeName}</p>
                        <p className="text-xs text-gray-500">{row.employeeCode}</p>
                      </td>
                      <td className="px-4 py-3">{renderBadge(row.employeeStatus)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.designation}</td>
                      <td className="max-w-[220px] px-4 py-3 text-sm text-gray-700">{row.missingMasterFields}</td>
                      <td className="max-w-[220px] px-4 py-3 text-sm text-gray-700">{row.missingRequiredDocuments}</td>
                      <td className="px-4 py-3">{renderBadge(row.salaryStructureStatus)}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {renderBadge(row.payslipStatus)}
                          <p className="text-xs text-gray-500">{row.payslipRecords || 0} records</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {renderBadge(row.payslipAttachmentStatus)}
                          <p className="text-xs text-gray-500">{row.payslipRecordsMissingAttachments || 0} missing</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{renderBadge(row.readinessStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <ChartBarIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">No readiness data available</h3>
          </div>
        )}
      </div>
    );
  };

  const renderReportData = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500">Loading report...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading report</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    if (!reportData) return null;

    if (selectedReport === 'memory-readiness') {
      return renderMemoryReadinessReport();
    }

    const hasResults = reportData.results && reportData.results.length > 0;

    return (
      <div className="space-y-6">
        {/* Report Header with Export */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{reportData.report}</h3>
              {reportData.totalRecords !== undefined && (
                <p className="text-sm text-gray-500">Total Records: {reportData.totalRecords}</p>
              )}
            </div>
            {hasResults && (
              <button
                onClick={exportToCSV}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        {reportData.summary && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  {typeof value === 'object' && value !== null ? (
                    <div className="space-y-1">
                      {Object.entries(value).map(([k, v]) => (
                        <p key={k} className="text-sm text-gray-700 flex justify-between">
                          <span className="font-medium">{k}:</span>
                          <span className="text-gray-900 font-semibold">{String(v)}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{String(value)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Table */}
        {hasResults ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(reportData.results[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.results.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      {Object.values(row).map((value: any, cellIdx) => (
                        <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {value !== null && value !== undefined ? String(value) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 border-2 border-dashed border-gray-300 text-center">
            <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              There are no records matching the selected criteria. Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>
    );
  };

  const currentReport = REPORT_CARDS.find((r) => r.id === selectedReport);

  return (
    <ModernLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-2 text-sm text-gray-600">
              Generate comprehensive HR reports and export data for analysis
            </p>
          </div>
        </div>

        {/* Date Range Filter & Back Button (shown when report is selected) */}
        {selectedReport && (
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              {currentReport?.requiresDateRange && (
                <>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full sm:w-auto">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => currentReport && fetchReport(currentReport)}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Refresh
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setReportData(null);
                  setError(null);
                }}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Reports
              </button>
            </div>
          </div>
        )}

        {!selectedReport && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Analytics Question
                </label>
                <input
                  type="text"
                  value={analyticsQuestion}
                  onChange={(e) => setAnalyticsQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                onClick={runAnalyticsQuery}
                disabled={analyticsLoading || !analyticsQuestion.trim()}
                className="btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                <ChartBarIcon className="h-4 w-4" />
                {analyticsLoading ? 'Analyzing...' : 'Run Analytics'}
              </button>
            </div>

            {analyticsResult && (
              <div className="mt-6 space-y-4">
                <div className="text-sm text-gray-700">{analyticsResult.answer}</div>
                {analyticsResult.metrics?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analyticsResult.metrics.map((metric: any) => (
                      <div key={metric.metricName} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          {metric.metricName.replace(/_/g, ' ')}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">
                          {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
                        </p>
                        {metric.trend && (
                          <p className="mt-1 text-xs text-gray-500 capitalize">{metric.trend}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {analyticsResult.followUpQuestions?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {analyticsResult.followUpQuestions.map((question: string) => (
                      <button
                        key={question}
                        onClick={() => setAnalyticsQuestion(question)}
                        className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Report Cards Grid */}
        {!selectedReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REPORT_CARDS.map((report) => {
              const colors = getColorClasses(report.color);
              return (
                <button
                  key={report.id}
                  onClick={() => fetchReport(report)}
                  className={`text-left bg-white rounded-lg shadow-sm p-6 border-2 ${colors.border} transition-all duration-200 hover:shadow-md ${colors.hover} group`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${colors.bg} flex-shrink-0`}>
                      <report.icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {report.description}
                      </p>
                      {report.requiresDateRange && (
                        <span className="inline-flex items-center mt-3 text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-medium">
                          📅 Date Range Required
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Report Data */}
        {selectedReport && renderReportData()}
      </div>
    </ModernLayout>
  );
}
