import { useEffect, useMemo, useState } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BookmarkIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
  PresentationChartLineIcon,
  SparklesIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';

type WorkbenchTab = 'builder' | 'saved';
type ViewMode = 'table' | 'summary' | 'visual';
type ExportFormat = 'csv' | 'json' | 'print';
type ChartType = 'bar' | 'pie' | 'line';
type AggregationMode = 'count' | 'sum' | 'average';

interface AnalyticsTopic {
  id: string;
  title: string;
  purpose: string;
  prompt: string;
  endpoint: string;
  reportType: string;
  category: string;
  dateRange?: boolean;
  icon: typeof ChartBarIcon;
  tone: string;
  suggestedColumns?: string[];
  defaultGroupBy?: string;
  measureField?: string;
  measureLabel?: string;
  aggregation?: AggregationMode;
  defaultParams?: Record<string, string>;
}

interface SavedReportCard {
  reportId: string;
  reportName: string;
  description?: string;
  category: string;
  reportType: string;
  filterConfig?: any;
  chartConfig?: any;
  outputFormat?: string;
  executionCount?: number;
  lastExecutedAt?: string;
  createdAt?: string;
}

const today = new Date();
const firstDayOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
const todayIso = today.toISOString().split('T')[0];

const TOPICS: AnalyticsTopic[] = [
  {
    id: 'headcount',
    title: 'Workforce snapshot',
    purpose: 'Understand active workforce distribution by department, employment type, status, and location.',
    prompt: 'Show current headcount by department, employment type, status, and location.',
    endpoint: '/reports/headcount',
    reportType: 'headcount',
    category: 'workforce',
    icon: DocumentChartBarIcon,
    tone: 'blue',
    suggestedColumns: ['department', 'employmentType', 'status', 'location', 'count'],
    defaultGroupBy: 'department',
    measureField: 'count',
    measureLabel: 'Headcount',
    aggregation: 'sum',
    defaultParams: { status: 'active' },
  },
  {
    id: 'attendance',
    title: 'Attendance operations',
    purpose: 'Review presence, absence, regularity, and work mode patterns for a selected period.',
    prompt: 'Analyze attendance rate and presence patterns for this period.',
    endpoint: '/reports/attendance-summary',
    reportType: 'attendance_summary',
    category: 'attendance',
    dateRange: true,
    icon: PresentationChartLineIcon,
    tone: 'green',
    suggestedColumns: ['employeeName', 'department', 'presentDays', 'absentDays', 'onLeaveDays', 'totalWorkingDays', 'attendancePercentage'],
    defaultGroupBy: 'department',
    measureField: 'presentDays',
    measureLabel: 'Present days',
    aggregation: 'sum',
  },
  {
    id: 'leave',
    title: 'Leave position',
    purpose: 'See leave eligibility, usage, balance, and policy utilization across employees.',
    prompt: 'Show leave utilization and balance position across employees.',
    endpoint: '/reports/leave-balance',
    reportType: 'leave_balance',
    category: 'leave',
    icon: FunnelIcon,
    tone: 'purple',
    suggestedColumns: ['employeeName', 'department', 'leaveType', 'totalAllocated', 'used', 'available'],
    defaultGroupBy: 'leaveType',
    measureField: 'used',
    measureLabel: 'Leave used',
    aggregation: 'sum',
  },
  {
    id: 'movement',
    title: 'Joiners and leavers',
    purpose: 'Track monthly people movement and headcount change over a period.',
    prompt: 'Show joiners and leavers movement trend for this period.',
    endpoint: '/reports/joiners-leavers',
    reportType: 'joiners_leavers',
    category: 'workforce',
    dateRange: true,
    icon: ArrowPathIcon,
    tone: 'indigo',
    suggestedColumns: ['month', 'joiners', 'leavers', 'netChange'],
    defaultGroupBy: 'month',
    measureField: 'netChange',
    measureLabel: 'Net change',
    aggregation: 'sum',
  },
  {
    id: 'confirmation',
    title: 'Probation and confirmations',
    purpose: 'Find employees whose probation confirmation is due or overdue.',
    prompt: 'Show confirmation due and probation pending employees.',
    endpoint: '/reports/confirmation-due',
    reportType: 'confirmation_due',
    category: 'confirmation',
    icon: CheckCircleIcon,
    tone: 'orange',
    suggestedColumns: ['employeeName', 'department', 'designation', 'probationEndDate', 'daysRemaining'],
    defaultGroupBy: 'department',
    measureLabel: 'Employees',
    aggregation: 'count',
  },
  {
    id: 'attrition',
    title: 'Attrition and exits',
    purpose: 'Analyze exit volume, attrition rate, and separation pattern over a selected period.',
    prompt: 'Show attrition and exit trend for this period.',
    endpoint: '/reports/attrition',
    reportType: 'attrition',
    category: 'exit',
    dateRange: true,
    icon: ChartBarIcon,
    tone: 'red',
    suggestedColumns: ['department', 'month', 'exits', 'attritionRate', 'voluntaryExits', 'involuntaryExits'],
    defaultGroupBy: 'department',
    measureField: 'exits',
    measureLabel: 'Exits',
    aggregation: 'sum',
  },
  {
    id: 'performance',
    title: 'Performance cycle',
    purpose: 'Check appraisal cycle completion, pending reviews, and overdue actions.',
    prompt: 'Show performance review completion status.',
    endpoint: '/reports/pms-completion',
    reportType: 'review_completion',
    category: 'performance',
    icon: PresentationChartLineIcon,
    tone: 'amber',
    suggestedColumns: ['employeeName', 'department', 'reviewCycle', 'status', 'overdueDays'],
    defaultGroupBy: 'status',
    measureLabel: 'Reviews',
    aggregation: 'count',
  },
  {
    id: 'documents',
    title: 'Document completeness',
    purpose: 'Identify employee document gaps and compliance readiness issues.',
    prompt: 'Show missing employee documents and compliance gaps.',
    endpoint: '/reports/missing-documents',
    reportType: 'missing_documents',
    category: 'compliance',
    icon: DocumentDuplicateIcon,
    tone: 'pink',
    suggestedColumns: ['employeeName', 'department', 'missingDocuments', 'criticality'],
    defaultGroupBy: 'criticality',
    measureField: 'documentCount',
    measureLabel: 'Missing documents',
    aggregation: 'sum',
  },
  {
    id: 'memory',
    title: 'ACV memory readiness',
    purpose: 'Validate employee master, company documents, compensation, and payslip coverage.',
    prompt: 'Show ACV implementation memory readiness and missing data.',
    endpoint: '/reports/memory-readiness',
    reportType: 'missing_documents',
    category: 'compliance',
    icon: SparklesIcon,
    tone: 'cyan',
    suggestedColumns: ['employeeName', 'employeeStatus', 'department', 'designation', 'missingMasterFields', 'readinessStatus'],
    defaultGroupBy: 'readinessStatus',
    measureLabel: 'Employees',
    aggregation: 'count',
  },
];

const toneClasses: Record<string, { bg: string; border: string; text: string; soft: string; bar: string }> = {
  blue: { bg: 'bg-blue-600', border: 'border-blue-200', text: 'text-blue-700', soft: 'bg-blue-50', bar: 'bg-blue-500' },
  green: { bg: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-700', soft: 'bg-emerald-50', bar: 'bg-emerald-500' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-200', text: 'text-purple-700', soft: 'bg-purple-50', bar: 'bg-purple-500' },
  indigo: { bg: 'bg-indigo-600', border: 'border-indigo-200', text: 'text-indigo-700', soft: 'bg-indigo-50', bar: 'bg-indigo-500' },
  orange: { bg: 'bg-orange-600', border: 'border-orange-200', text: 'text-orange-700', soft: 'bg-orange-50', bar: 'bg-orange-500' },
  red: { bg: 'bg-red-600', border: 'border-red-200', text: 'text-red-700', soft: 'bg-red-50', bar: 'bg-red-500' },
  amber: { bg: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700', soft: 'bg-amber-50', bar: 'bg-amber-500' },
  pink: { bg: 'bg-pink-600', border: 'border-pink-200', text: 'text-pink-700', soft: 'bg-pink-50', bar: 'bg-pink-500' },
  cyan: { bg: 'bg-cyan-600', border: 'border-cyan-200', text: 'text-cyan-700', soft: 'bg-cyan-50', bar: 'bg-cyan-500' },
};

const labelize = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

const flattenValue = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const toNumber = (value: any): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const isNumericColumn = (rows: any[], column: string) =>
  rows.some((row) => row?.[column] !== null && row?.[column] !== undefined && row?.[column] !== '' && !Number.isNaN(Number(row[column])));

const extractRows = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data)) return data;
  return [];
};

const buildContextualNarrative = (topic: AnalyticsTopic, data: any, rowCount: number) => {
  const reportName = data?.report || topic.title;
  const summary = data?.summary || {};
  const summaryParts = Object.entries(summary)
    .filter(([, value]) => typeof value !== 'object' || value === null)
    .slice(0, 3)
    .map(([key, value]) => `${labelize(key)}: ${flattenValue(value)}`);

  const suffix = summaryParts.length > 0 ? ` Key signals: ${summaryParts.join(' | ')}.` : '';
  return `Fetched ${rowCount} source rows for ${reportName}. You can now refine columns, search the result set, group the data, switch to visualization, export it, or save this configuration as a reusable report template.${suffix}`;
};

export default function ModernReports() {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('builder');
  const [question, setQuestion] = useState(TOPICS[0].prompt);
  const [selectedTopicId, setSelectedTopicId] = useState(TOPICS[0].id);
  const [dateRange, setDateRange] = useState({ startDate: firstDayOfYear, endDate: todayIso });
  const [reportData, setReportData] = useState<any>(null);
  const [analyticsResult, setAnalyticsResult] = useState<any>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [groupBy, setGroupBy] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReportCard[]>([]);

  const selectedTopic = TOPICS.find((topic) => topic.id === selectedTopicId) || TOPICS[0];
  const rows = useMemo(() => extractRows(reportData), [reportData]);
  const availableColumns = useMemo(() => {
    const columns = new Set<string>();
    rows.slice(0, 25).forEach((row) => Object.keys(row || {}).forEach((key) => columns.add(key)));
    return Array.from(columns);
  }, [rows]);
  const groupableColumns = useMemo(() => {
    const preferred = selectedTopic.defaultGroupBy && availableColumns.includes(selectedTopic.defaultGroupBy)
      ? [selectedTopic.defaultGroupBy]
      : [];
    const categorical = availableColumns.filter((column) => !isNumericColumn(rows, column));
    return Array.from(new Set([...preferred, ...categorical]));
  }, [availableColumns, rows, selectedTopic.defaultGroupBy]);
  const effectiveMeasureField = selectedTopic.measureField && availableColumns.includes(selectedTopic.measureField)
    ? selectedTopic.measureField
    : undefined;
  const measureColumnKey = 'metricValue';
  const measureColumnLabel = selectedTopic.measureLabel || (effectiveMeasureField ? labelize(effectiveMeasureField) : 'Records');

  const visibleColumns = selectedColumns.length > 0
    ? selectedColumns.filter((column) => availableColumns.includes(column))
    : availableColumns.slice(0, 8);

  const groupedRows = useMemo(() => {
    if (!groupBy) return [];
    const groups = new Map<string, { total: number; count: number }>();
    rows.forEach((row) => {
      const key = flattenValue(row[groupBy]);
      const current = groups.get(key) || { total: 0, count: 0 };
      const value = selectedTopic.aggregation === 'count' || !effectiveMeasureField ? 1 : toNumber(row[effectiveMeasureField]);
      groups.set(key, { total: current.total + value, count: current.count + 1 });
    });
    return Array.from(groups.entries())
      .map(([label, aggregate]) => ({
        label,
        count: aggregate.count,
        value: selectedTopic.aggregation === 'average'
          ? aggregate.count > 0 ? Math.round((aggregate.total / aggregate.count) * 10) / 10 : 0
          : aggregate.total,
      }))
      .sort((a, b) => b.value - a.value);
  }, [effectiveMeasureField, groupBy, rows, selectedTopic.aggregation]);

  const groupedDisplayRows = useMemo(() => {
    if (!groupBy) return rows;
    return groupedRows.map((group) => ({
      [groupBy]: group.label,
      [measureColumnKey]: group.value,
      records: group.count,
    }));
  }, [groupBy, groupedRows, measureColumnKey, rows]);

  const groupedDisplayColumns = groupBy ? [groupBy, measureColumnKey, 'records'] : visibleColumns;
  const tableRows = rows;
  const tableColumns = visibleColumns;
  const exportRows = viewMode === 'table' ? tableRows : groupedDisplayRows;
  const exportColumns = viewMode === 'table' ? tableColumns : groupedDisplayColumns;

  const summaryCards = useMemo(() => {
    const summary = reportData?.summary || {};
    const primitiveSummary = Object.entries(summary)
      .filter(([, value]) => typeof value !== 'object' || value === null)
      .slice(0, 6)
      .map(([key, value]) => ({ label: labelize(key), value: flattenValue(value) }));

    if (primitiveSummary.length > 0) return primitiveSummary;

    return [
      { label: 'Rows fetched', value: String(rows.length) },
      { label: 'Columns available', value: String(availableColumns.length) },
      { label: 'Rows in current view', value: String(viewMode === 'table' ? tableRows.length : groupedDisplayRows.length) },
      { label: 'Grouping', value: groupBy ? labelize(groupBy) : 'None' },
    ];
  }, [availableColumns.length, groupedDisplayRows.length, groupBy, reportData, rows.length, tableRows.length, viewMode]);

  useEffect(() => {
    loadSavedReports();
  }, []);

  useEffect(() => {
    if (!rows.length || !availableColumns.length) return;

    setSelectedColumns((current) => {
      const retained = current.filter((column) => availableColumns.includes(column));
      if (retained.length > 0) return retained;

      const suggested = selectedTopic.suggestedColumns?.filter((column) => availableColumns.includes(column)) || [];
      return suggested.length > 0 ? suggested : availableColumns.slice(0, 8);
    });

    setGroupBy((current) => {
      if (current && groupableColumns.includes(current)) return current;
      if (viewMode !== 'visual') return '';
      return selectedTopic.defaultGroupBy && groupableColumns.includes(selectedTopic.defaultGroupBy)
        ? selectedTopic.defaultGroupBy
        : groupableColumns[0] || '';
    });
  }, [availableColumns.join('|'), groupableColumns.join('|'), rows.length, selectedTopicId, selectedTopic.suggestedColumns, selectedTopic.defaultGroupBy, viewMode]);

  const ensureGrouping = () => {
    if (groupBy) return groupBy;
    const fallback = selectedTopic.defaultGroupBy && groupableColumns.includes(selectedTopic.defaultGroupBy)
      ? selectedTopic.defaultGroupBy
      : groupableColumns[0] || '';
    if (fallback) setGroupBy(fallback);
    return fallback;
  };

  const changeViewMode = (mode: ViewMode) => {
    if (mode === 'visual') {
      ensureGrouping();
    }
    setViewMode(mode);
  };

  const loadSavedReports = async () => {
    try {
      const response = await api.get<SavedReportCard[]>('/reports/saved');
      setSavedReports(response.data || []);
    } catch (err) {
      console.error('Failed to load saved reports', err);
    }
  };

  const buildReportUrl = (topic: AnalyticsTopic) => {
    const params = new URLSearchParams(topic.defaultParams || {});
    if (topic.dateRange) {
      params.set('startDate', dateRange.startDate);
      params.set('endDate', dateRange.endDate);
    }
    const query = params.toString();
    return query ? `${topic.endpoint}?${query}` : topic.endpoint;
  };

  const runWorkbench = async (topic = selectedTopic, nextQuestion = question) => {
    setLoading(true);
    setError(null);
    setReportData(null);
    setAnalyticsResult(null);

    try {
      const reportResponse = await api.get(buildReportUrl(topic));
      setReportData(reportResponse.data);

      try {
        const analyticsResponse = await api.post('/analytics/query', { question: nextQuestion.trim() || topic.prompt });
        const analyticsRows = extractRows(reportResponse.data);
        const analyticsPayload = analyticsResponse.data;
        const recognized = Array.isArray(analyticsPayload?.metrics) && analyticsPayload.metrics.length > 0;
        setAnalyticsResult(
          recognized
            ? analyticsPayload
            : {
                answer: buildContextualNarrative(topic, reportResponse.data, analyticsRows.length),
                followUpQuestions: [
                  `Group ${topic.title.toLowerCase()} by ${labelize(topic.defaultGroupBy || 'department')}`,
                  `Show only critical ${topic.title.toLowerCase()} records`,
                  `Convert this ${topic.title.toLowerCase()} view into a chart`,
                ],
              }
        );
      } catch (analyticsError) {
        setAnalyticsResult({
          answer: buildContextualNarrative(topic, reportResponse.data, extractRows(reportResponse.data).length),
          followUpQuestions: [],
        });
      }
      setViewMode('table');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to build analytics view');
    } finally {
      setLoading(false);
    }
  };

  const selectTopic = (topic: AnalyticsTopic) => {
    setSelectedTopicId(topic.id);
    setQuestion(topic.prompt);
    setReportData(null);
    setAnalyticsResult(null);
    setSelectedColumns([]);
    setColumnsOpen(false);
    setGroupBy('');
    setViewMode('table');
    setChartType('bar');
  };

  const exportData = (format: ExportFormat) => {
    const filenameBase = `${selectedTopic.id}_${new Date().toISOString().split('T')[0]}`;

    if (format === 'print') {
      window.print();
      return;
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify({ reportData, rows: exportRows, groupBy, columns: exportColumns, viewMode }, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${filenameBase}.json`);
      return;
    }

    const columns = exportColumns.length ? exportColumns : availableColumns;
    const csv = [
      columns.map(getColumnLabel).join(','),
      ...exportRows.map((row) =>
        columns.map((column) => {
          const text = flattenValue(row[column]);
          return text.includes(',') || text.includes('"') ? `"${text.replace(/"/g, '""')}"` : text;
        }).join(',')
      ),
    ].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filenameBase}.csv`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveCurrentReport = async () => {
    if (!reportData) return;
    const name = `${selectedTopic.title} - ${new Date().toLocaleDateString()}`;
    setSaving(true);
    setError(null);

    try {
      await api.post('/reports/saved', {
        reportName: name,
        description: question,
        category: selectedTopic.category,
        reportType: selectedTopic.reportType,
        filterConfig: {
          dateRange: selectedTopic.dateRange ? dateRange : undefined,
          customFilters: {
            topicId: selectedTopic.id,
            question,
            columns: visibleColumns,
            groupBy,
            viewMode,
            chartType,
          },
        },
        chartConfig: groupBy ? { type: chartType, xAxis: groupBy, yAxis: effectiveMeasureField || 'records', groupBy, aggregation: selectedTopic.aggregation || 'count' } : undefined,
        outputFormat: 'json',
        isPublic: false,
      });
      await loadSavedReports();
      setActiveTab('saved');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save report template');
    } finally {
      setSaving(false);
    }
  };

  const executeSavedReport = async (report: SavedReportCard) => {
    setLoading(true);
    setError(null);
    setActiveTab('builder');

    try {
      const savedTopicId = report.filterConfig?.customFilters?.topicId;
      const matchingTopic =
        TOPICS.find((topic) => topic.id === savedTopicId) ||
        TOPICS.find((topic) => topic.reportType === report.reportType) ||
        selectedTopic;

      setSelectedTopicId(matchingTopic.id);
      setQuestion(report.description || report.reportName);
      const savedColumns = report.filterConfig?.customFilters?.columns;
      if (Array.isArray(savedColumns)) setSelectedColumns(savedColumns);
      setGroupBy(report.filterConfig?.customFilters?.groupBy || matchingTopic.defaultGroupBy || '');
      setViewMode(report.filterConfig?.customFilters?.viewMode || 'table');
      setChartType(report.filterConfig?.customFilters?.chartType || report.chartConfig?.type || 'bar');

      if (report.filterConfig?.dateRange) {
        setDateRange(report.filterConfig.dateRange);
      }

      const response =
        savedTopicId
          ? await api.get(buildReportUrl(matchingTopic))
          : await api.post(`/reports/saved/${report.reportId}/execute`);

      setReportData(response.data);
      setAnalyticsResult({
        answer: buildContextualNarrative(matchingTopic, response.data, extractRows(response.data).length),
        followUpQuestions: [],
      });
      await loadSavedReports();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to execute saved report');
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns((current) => {
      const base = current.length > 0 ? current : availableColumns.slice(0, 8);
      return base.includes(column) ? base.filter((item) => item !== column) : [...base, column];
    });
  };

  const maxGroupCount = Math.max(...groupedRows.map((row) => row.value), 1);
  const tone = toneClasses[selectedTopic.tone] || toneClasses.blue;
  const piePalette = ['#2563eb', '#059669', '#7c3aed', '#ea580c', '#dc2626', '#0891b2', '#be123c', '#4f46e5'];
  const totalGroupCount = groupedRows.reduce((sum, group) => sum + group.value, 0);
  const chartTypeLabel = `${labelize(chartType)} chart`;
  const getColumnLabel = (column: string) => {
    if (column === measureColumnKey) return measureColumnLabel;
    if (column === 'records') return 'Source rows';
    return labelize(column);
  };
  const pieGradient = groupedRows.slice(0, 8).reduce(
    (segments, group, index) => {
      const start = segments.cursor;
      const end = start + (totalGroupCount ? (group.value / totalGroupCount) * 100 : 0);
      return {
        cursor: end,
        parts: [...segments.parts, `${piePalette[index % piePalette.length]} ${start}% ${end}%`],
      };
    },
    { cursor: 0, parts: [] as string[] }
  ).parts.join(', ');
  const linePoints = groupedRows.slice(0, 12).map((group, index, items) => {
    const x = items.length <= 1 ? 0 : (index / (items.length - 1)) * 100;
    const y = 100 - ((group.value / maxGroupCount) * 90 + 5);
    return `${x},${y}`;
  }).join(' ');

  return (
    <ModernLayout>
      <div className="mx-auto max-w-[1500px] space-y-4 p-4 lg:p-5">
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">HR Analytics</p>
                <h1 className="text-xl font-bold text-slate-950">Conversational report workbench</h1>
              </div>
              <p className="mt-1 max-w-4xl text-xs text-slate-600">
                Build HR views from a business question, then shape, visualize, export, or save them as reusable templates.
              </p>
            </div>
            <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setActiveTab('builder')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${activeTab === 'builder' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600'}`}
              >
                Builder
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${activeTab === 'saved' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600'}`}
              >
                Saved reports
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {activeTab === 'builder' ? (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="grid grid-cols-1 gap-2 xl:grid-cols-[280px_1fr_108px] xl:items-start">
                <div className="min-w-0">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    HR/Business Perspective
                  </label>
                  <select
                    value={selectedTopicId}
                    onChange={(event) => {
                      const topic = TOPICS.find((item) => item.id === event.target.value);
                      if (topic) selectTopic(topic);
                    }}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  >
                    {TOPICS.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Ask Manu</label>
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    rows={1}
                    className="h-10 w-full resize-none overflow-hidden rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    placeholder="Example: Show leave utilization by employee and department"
                  />
                </div>

                <div className="pt-[21px]">
                  <button
                    onClick={() => runWorkbench()}
                    disabled={loading || !question.trim()}
                    className="btn-primary flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap px-3 text-xs disabled:opacity-60"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    {loading ? 'Building...' : 'Build'}
                  </button>
                </div>
              </div>
              <p className="mt-2 line-clamp-1 text-xs leading-5 text-slate-500">{selectedTopic.purpose}</p>

              {analyticsResult && (
                <div className={`mt-3 rounded-lg border ${tone.border} ${tone.soft} px-3 py-2`}>
                  <p className="text-xs font-medium leading-5 text-slate-800">{analyticsResult.answer}</p>
                  {analyticsResult.followUpQuestions?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {analyticsResult.followUpQuestions.map((followUp: string) => (
                        <button
                          key={followUp}
                          onClick={() => setQuestion(followUp)}
                          className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:text-primary-700"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {reportData && (
              <section className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="space-y-2">
                    <div className="min-w-0 border-b border-slate-100 pb-2">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Fetched source data</p>
                        <h2 className="truncate text-lg font-bold text-slate-950">{reportData.report || selectedTopic.title}</h2>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {rows.length} rows visible. {availableColumns.length} fields available.
                      </p>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-1.5 overflow-visible pb-1 xl:gap-2">
                      {selectedTopic.dateRange && (
                        <>
                          <input
                            aria-label="Start date"
                            type="date"
                            value={dateRange.startDate}
                            onChange={(event) => setDateRange({ ...dateRange, startDate: event.target.value })}
                            className="h-9 w-[124px] shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700"
                          />
                          <input
                            aria-label="End date"
                            type="date"
                            value={dateRange.endDate}
                            onChange={(event) => setDateRange({ ...dateRange, endDate: event.target.value })}
                            className="h-9 w-[124px] shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700"
                          />
                          <button
                            type="button"
                            onClick={() => runWorkbench()}
                            disabled={loading}
                            className="h-9 shrink-0 rounded-lg border border-primary-200 bg-primary-50 px-3 text-xs font-bold text-primary-700 disabled:opacity-60"
                          >
                            Apply dates
                          </button>
                        </>
                      )}
                      <select
                        aria-label="Group report by"
                        value={groupBy}
                        onChange={(event) => setGroupBy(event.target.value)}
                        className="h-9 w-[150px] shrink-0 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700"
                      >
                        <option value="">No grouping</option>
                        {groupableColumns.map((column) => (
                          <option key={column} value={column}>{labelize(column)}</option>
                        ))}
                      </select>
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setColumnsOpen((open) => !open)}
                          className="flex h-9 w-[210px] items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700"
                          aria-haspopup="listbox"
                          aria-expanded={columnsOpen}
                        >
                          <span className="truncate">{visibleColumns.length} columns selected</span>
                          <ChevronDownIcon className={`h-4 w-4 shrink-0 transition ${columnsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {columnsOpen && (
                        <div className="absolute left-0 z-20 mt-2 max-h-80 w-72 overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl" role="listbox" aria-label="Column selector">
                          <div className="mb-1 border-b border-slate-100 px-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            Multi-select fields
                          </div>
                          <div className="mb-2 flex gap-2 px-2">
                            <button
                              type="button"
                              onClick={() => setSelectedColumns(availableColumns)}
                              className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              Select all
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedColumns(availableColumns.slice(0, 8))}
                              className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              Reset
                            </button>
                          </div>
                          {availableColumns.map((column) => (
                            <button
                              key={column}
                              type="button"
                              aria-pressed={visibleColumns.includes(column)}
                              onClick={() => toggleColumn(column)}
                              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${
                                visibleColumns.includes(column) ? 'bg-primary-50 text-primary-800' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                                visibleColumns.includes(column) ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {visibleColumns.includes(column) ? '✓' : ''}
                              </span>
                              <span className="truncate">{labelize(column)}</span>
                            </button>
                          ))}
                        </div>
                        )}
                      </div>
                      <div className="flex h-9 shrink-0 items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        {(['table', 'summary', 'visual'] as ViewMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => changeViewMode(mode)}
                            className={`h-7 rounded-md px-2 text-xs font-semibold capitalize ${
                              viewMode === mode ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-700'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                      {viewMode === 'visual' && (
                        <div className="flex h-9 shrink-0 items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                          {(['bar', 'pie', 'line'] as ChartType[]).map((type) => (
                            <button
                              key={type}
                              type="button"
                              aria-label={`${labelize(type)} chart`}
                              aria-pressed={chartType === type}
                              onClick={() => setChartType(type)}
                              className={`h-7 rounded-md px-2.5 text-xs font-semibold ${
                                chartType === type ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700'
                              }`}
                            >
                              {labelize(type)}
                            </button>
                          ))}
                        </div>
                      )}
                      <details className="relative shrink-0">
                        <summary className="flex h-9 w-[96px] cursor-pointer list-none items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          Download
                        </summary>
                        <div className="absolute right-0 z-20 mt-2 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                          <button onClick={() => exportData('csv')} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">CSV</button>
                          <button onClick={() => exportData('json')} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">JSON</button>
                          <button onClick={() => exportData('print')} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">Print / PDF</button>
                        </div>
                      </details>
                      <button
                        onClick={saveCurrentReport}
                        disabled={saving}
                        className="flex h-9 w-[66px] shrink-0 items-center justify-center gap-1 rounded-lg bg-slate-950 px-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        <BookmarkIcon className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>

                <main className="space-y-3">
                  {viewMode === 'summary' && (
                    <div className="min-h-[460px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className={`rounded-xl border ${tone.border} ${tone.soft} p-4`}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${tone.text}`}>Summary infographic</p>
                            <h3 className="mt-1 text-xl font-bold text-slate-950">{reportData.report || selectedTopic.title}</h3>
                            <p className="mt-1 max-w-3xl text-sm text-slate-600">
                              {rows.length} source rows across {availableColumns.length} fields, shaped from the selected HR perspective.
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white px-6 py-4 text-center shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Records</p>
                            <p className="text-4xl font-bold text-slate-950">{rows.length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {summaryCards.map((card) => (
                          <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
                            <p className="mt-2 break-words text-2xl font-bold text-slate-950">{card.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewMode === 'visual' && (
                    <div className="min-h-[460px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ChartBarIcon className="h-5 w-5 text-primary-700" />
                          <h3 className="font-semibold text-slate-950">
                            {groupBy ? `${labelize(groupBy)} distribution` : 'Select a grouping field to visualize'}
                          </h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                          {chartTypeLabel}
                        </span>
                      </div>

                      {groupedRows.length > 0 ? (
                        <>
                          {chartType === 'bar' && (
                            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex h-56 items-end gap-4 overflow-x-auto border-b border-l border-slate-200 px-4 pb-4">
                              {groupedRows.slice(0, 12).map((group) => (
                                <div key={group.label} className="flex h-full min-w-[72px] flex-col items-center justify-end gap-2">
                                  <span className="text-xs font-bold text-slate-900">{group.value}</span>
                                  <div
                                    className={`w-12 rounded-t-lg ${tone.bar}`}
                                    style={{ height: `${Math.max(12, (group.value / maxGroupCount) * 160)}px` }}
                                  />
                                  <div className="h-10 w-full text-center text-[11px] font-semibold leading-4 text-slate-600">
                                    {group.label}
                                  </div>
                                </div>
                              ))}
                              </div>
                            </div>
                          )}

                          {chartType === 'pie' && (
                            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-center">
                              <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-full border border-slate-200 shadow-inner" style={{ background: `conic-gradient(${pieGradient || '#e2e8f0 0% 100%'})` }}>
                                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-sm">
                                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</span>
                                  <span className="text-3xl font-bold text-slate-950">{totalGroupCount}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {groupedRows.slice(0, 8).map((group, index) => (
                                  <div key={group.label} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                                    <span className="flex min-w-0 items-center gap-2">
                                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: piePalette[index % piePalette.length] }} />
                                      <span className="truncate text-sm font-medium text-slate-700">{group.label}</span>
                                    </span>
                                    <span className="text-sm font-bold text-slate-950">{group.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {chartType === 'line' && (
                            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <svg viewBox="0 0 100 100" className="h-56 w-full overflow-visible rounded-lg bg-white">
                                {[20, 40, 60, 80].map((y) => (
                                  <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#e2e8f0" strokeWidth="0.4" />
                                ))}
                                <polyline
                                  fill="none"
                                  stroke="#2563eb"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  points={linePoints}
                                />
                                {linePoints.split(' ').filter(Boolean).map((point, index) => {
                                  const [x, y] = point.split(',');
                                  return <circle key={point} cx={x} cy={y} r="1.8" fill={piePalette[index % piePalette.length]} />;
                                })}
                              </svg>
                              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                                {groupedRows.slice(0, 8).map((group) => (
                                  <div key={group.label} className="rounded-lg bg-white px-3 py-2">
                                    <p className="truncate text-xs font-semibold text-slate-600">{group.label}</p>
                                    <p className="text-lg font-bold text-slate-950">{group.value}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                          Select a grouping field to generate a chart.
                        </div>
                      )}
                    </div>
                  )}

                  {viewMode === 'table' && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="max-h-[calc(100vh-360px)] min-h-[460px] overflow-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="sticky top-0 z-10 bg-slate-50">
                            <tr>
                              {tableColumns.map((column) => (
                                <th key={column} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                  {getColumnLabel(column)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tableRows.length > 0 ? tableRows.slice(0, 250).map((row, index) => (
                              <tr key={index} className="hover:bg-slate-50">
                                {tableColumns.map((column) => (
                                  <td key={column} className="max-w-[280px] truncate px-4 py-3 text-sm text-slate-700">
                                    {flattenValue(row[column])}
                                  </td>
                                ))}
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={Math.max(tableColumns.length, 1)} className="px-4 py-10 text-center text-sm text-slate-500">
                                  No rows match the current view.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </main>
              </section>
            )}
          </>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Saved reports and templates</h2>
                <p className="mt-1 text-sm text-slate-600">Reusable report views, column choices, grouping rules, and visualization settings.</p>
              </div>
              <button onClick={loadSavedReports} className="btn-secondary flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4" />
                Refresh
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedReports.length > 0 ? savedReports.map((report) => (
                <button
                  key={report.reportId}
                  onClick={() => executeSavedReport(report)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-primary-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-lg bg-white p-2 text-primary-700 shadow-sm">
                      <TableCellsIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-slate-950">{report.reportName}</span>
                      <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                        {labelize(report.category)} | {labelize(report.reportType)}
                      </span>
                      {report.description && <span className="mt-2 line-clamp-2 block text-sm text-slate-600">{report.description}</span>}
                      <span className="mt-3 block text-xs text-slate-500">
                        Used {report.executionCount || 0} times
                        {report.lastExecutedAt ? ` | Last run ${new Date(report.lastExecutedAt).toLocaleDateString()}` : ''}
                      </span>
                    </span>
                  </div>
                </button>
              )) : (
                <div className="col-span-full rounded-xl border-2 border-dashed border-slate-300 p-10 text-center">
                  <BookmarkIcon className="mx-auto h-10 w-10 text-slate-400" />
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">No saved reports yet</h3>
                  <p className="mt-1 text-sm text-slate-500">Build a view, shape it, then save it as a reusable template.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </ModernLayout>
  );
}
