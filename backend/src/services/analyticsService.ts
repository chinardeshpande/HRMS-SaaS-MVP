import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AnalyticsMetric, MetricCategory, MetricType, AggregationMethod } from '../models/AnalyticsMetric';
import logger from '../utils/logger';

export interface MetricValue {
  metricName: string;
  value: number | string;
  period?: string;
  dimensions?: Record<string, any>;
  comparisonValue?: number | string;
  percentChange?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface InsightResult {
  question: string;
  answer: string;
  metrics: MetricValue[];
  chartData?: any;
  insights?: string[];
  recommendations?: string[];
  followUpQuestions?: string[];
}

type CoreMetricDefinition = Pick<
  AnalyticsMetric,
  | 'metricName'
  | 'displayName'
  | 'description'
  | 'category'
  | 'metricType'
  | 'aggregation'
  | 'queryConfig'
  | 'dimensions'
  | 'unit'
  | 'thresholds'
  | 'tags'
  | 'synonyms'
>;

/**
 * Analytics Service
 * Provides semantic metrics layer and conversational analytics capabilities
 */
export class AnalyticsService {
  private metricRepo: Repository<AnalyticsMetric>;

  // Predefined safe metrics catalog
  private static readonly CORE_METRICS: CoreMetricDefinition[] = [
    {
      metricName: 'headcount',
      displayName: 'Total Headcount',
      description: 'Total number of active employees',
      category: MetricCategory.WORKFORCE,
      metricType: MetricType.COUNT,
      aggregation: AggregationMethod.COUNT,
      queryConfig: {
        sourceTable: 'employees',
        selectFields: ['COUNT(*) as value'],
        filters: { status: 'active' },
      },
      dimensions: {
        available: ['department', 'location', 'employmentType'],
        default: 'department',
      },
      unit: 'employees',
      tags: ['headcount', 'employees', 'workforce', 'count'],
      synonyms: ['employee count', 'number of employees', 'total employees'],
    },
    {
      metricName: 'attrition_rate',
      displayName: 'Attrition Rate',
      description: 'Percentage of employees who left in a given period',
      category: MetricCategory.ATTRITION,
      metricType: MetricType.PERCENTAGE,
      aggregation: AggregationMethod.AVG,
      queryConfig: {
        sourceTable: 'exit_cases',
        selectFields: ['(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM employees e WHERE e."tenantId" = exit_cases."tenantId" AND e.status = \'active\'), 0)) as value'],
        dateField: 'lastWorkingDate',
      },
      dimensions: {
        available: ['department', 'month', 'quarter'],
        default: 'month',
      },
      unit: '%',
      thresholds: {
        critical: 15,
        warning: 10,
        good: 5,
      },
      tags: ['attrition', 'turnover', 'exits', 'retention'],
      synonyms: ['turnover rate', 'exit rate', 'churn rate'],
    },
    {
      metricName: 'attendance_rate',
      displayName: 'Attendance Rate',
      description: 'Percentage of employees present vs total working days',
      category: MetricCategory.ATTENDANCE,
      metricType: MetricType.PERCENTAGE,
      aggregation: AggregationMethod.AVG,
      queryConfig: {
        sourceTable: 'attendance',
        selectFields: ['(SUM(CASE WHEN status = \'present\' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as value'],
        dateField: 'date',
      },
      dimensions: {
        available: ['department', 'date', 'shift'],
        default: 'date',
      },
      unit: '%',
      thresholds: {
        critical: 85,
        warning: 90,
        good: 95,
      },
      tags: ['attendance', 'presence', 'punctuality'],
      synonyms: ['attendance percentage', 'presence rate'],
    },
    {
      metricName: 'leave_utilization',
      displayName: 'Leave Utilization Rate',
      description: 'Percentage of leave days used vs entitled',
      category: MetricCategory.LEAVE,
      metricType: MetricType.PERCENTAGE,
      aggregation: AggregationMethod.AVG,
      queryConfig: {
        sourceTable: 'leave_balances',
        selectFields: ['(SUM(used) * 100.0 / NULLIF(SUM("totalAllocated"), 0)) as value'],
      },
      dimensions: {
        available: ['leaveType', 'department', 'month'],
        default: 'leaveType',
      },
      unit: '%',
      tags: ['leave', 'vacation', 'time off'],
      synonyms: ['leave usage', 'vacation utilization'],
    },
    {
      metricName: 'confirmation_pending',
      displayName: 'Confirmations Pending',
      description: 'Number of employees pending probation confirmation',
      category: MetricCategory.CONFIRMATION,
      metricType: MetricType.COUNT,
      aggregation: AggregationMethod.COUNT,
      queryConfig: {
        sourceTable: 'employees',
        selectFields: ['COUNT(*) as value'],
        filters: { status: 'active', probationEndDate: 'IS NOT NULL' },
      },
      dimensions: {
        available: ['department', 'dueStatus'],
        default: 'dueStatus',
      },
      unit: 'employees',
      tags: ['confirmation', 'probation', 'pending'],
      synonyms: ['probation pending', 'confirmation due', 'employees to confirm'],
    },
    {
      metricName: 'review_completion_rate',
      displayName: 'Review Completion Rate',
      description: 'Percentage of performance reviews completed',
      category: MetricCategory.PERFORMANCE,
      metricType: MetricType.PERCENTAGE,
      aggregation: AggregationMethod.AVG,
      queryConfig: {
        sourceTable: 'performance_reviews',
        selectFields: ['(SUM(CASE WHEN "currentState" = \'cycle_complete\' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) as value'],
        dateField: 'reviewEndDate',
      },
      dimensions: {
        available: ['department', 'reviewCycle', 'quarter'],
        default: 'reviewCycle',
      },
      unit: '%',
      thresholds: {
        critical: 70,
        warning: 85,
        good: 95,
      },
      tags: ['performance', 'reviews', 'appraisal', 'completion'],
      synonyms: ['appraisal completion', 'review status', 'performance completion'],
    },
  ];

  constructor() {
    this.metricRepo = AppDataSource.getRepository(AnalyticsMetric);
  }

  /**
   * Initialize core metrics in the database
   */
  async initializeCoreMetrics(tenantId: string): Promise<void> {
    for (const metricDef of AnalyticsService.CORE_METRICS) {
      const existing = await this.metricRepo.findOne({
        where: { tenantId, metricName: metricDef.metricName },
      });

      if (!existing) {
        const metric = this.metricRepo.create({
          ...metricDef,
          tenantId,
          isCustom: false,
        });
        await this.metricRepo.save(metric);
        logger.info(`Initialized metric: ${metricDef.metricName} for tenant: ${tenantId}`);
      }
    }
  }

  /**
   * Get all available metrics
   */
  async getAvailableMetrics(tenantId: string): Promise<AnalyticsMetric[]> {
    return await this.metricRepo.find({
      where: { tenantId, isActive: true },
      order: { category: 'ASC', displayName: 'ASC' },
    });
  }

  /**
   * Calculate a specific metric
   */
  async calculateMetric(
    tenantId: string,
    metricName: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      department?: string;
      dimensions?: Record<string, any>;
    }
  ): Promise<MetricValue> {
    const metric = await this.metricRepo.findOne({
      where: { tenantId, metricName, isActive: true },
    });

    if (!metric) {
      throw new Error(`Metric not found: ${metricName}`);
    }

    const { query, params } = this.buildMetricQuery(metric, filters);
    const result = await AppDataSource.query(query, params);

    const value = result[0]?.value || 0;

    // Calculate trend if comparison data exists
    const trend = await this.calculateTrend(metric, value, filters);

    // Update metric's last calculated value
    metric.lastCalculatedAt = new Date();
    metric.lastValue = {
      value,
      calculatedAt: new Date().toISOString(),
      period: filters?.startDate ? `${filters.startDate} to ${filters.endDate}` : 'current',
    };
    metric.usageCount += 1;
    await this.metricRepo.save(metric);

    return {
      metricName: metric.metricName,
      value,
      period: metric.lastValue.period,
      dimensions: filters?.dimensions,
      ...trend,
    };
  }

  /**
   * Build SQL query for metric calculation
   */
  private buildMetricQuery(metric: AnalyticsMetric, filters?: any): { query: string; params: any[] } {
    const { sourceTable, selectFields, groupBy, filters: metricFilters, joins, dateField, orderBy } = metric.queryConfig;

    let query = `SELECT ${selectFields.join(', ')} FROM ${sourceTable}`;
    const params: any[] = [metric.tenantId];

    // Add joins
    if (joins && joins.length > 0) {
      joins.forEach((join: any) => {
        query += ` ${join.type || 'INNER'} JOIN ${join.table} ON ${join.on}`;
      });
    }

    // Add filters
    const whereConditions: string[] = [];

    // Tenant isolation
    whereConditions.push(`"${sourceTable}"."tenantId" = $1`);

    // Metric-specific filters
    if (metricFilters) {
      Object.entries(metricFilters).forEach(([key, value]) => {
        if (value !== 'IS NOT NULL') {
          params.push(value);
          whereConditions.push(`"${key}" = $${params.length}`);
        } else {
          whereConditions.push(`"${key}" ${value}`);
        }
      });
    }

    // User-provided filters
    if (filters?.startDate && filters?.endDate && dateField) {
      params.push(filters.startDate);
      params.push(filters.endDate);
      whereConditions.push(`"${dateField}" BETWEEN $${params.length - 1} AND $${params.length}`);
    }

    if (filters?.department) {
      params.push(filters.department);
      whereConditions.push(`"departmentId" = $${params.length}`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add group by
    if (groupBy && groupBy.length > 0) {
      query += ` GROUP BY ${groupBy.join(', ')}`;
    }

    // Add order by
    if (orderBy) {
      const orderClauses = Object.entries(orderBy).map(([field, direction]) => `"${field}" ${direction}`);
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    return { query, params };
  }

  /**
   * Calculate trend compared to previous period
   */
  private async calculateTrend(
    metric: AnalyticsMetric,
    currentValue: number,
    filters?: any
  ): Promise<{ comparisonValue?: number; percentChange?: number; trend?: 'up' | 'down' | 'stable' }> {
    if (typeof currentValue !== 'number') return {};

    // Get previous value from last calculation
    if (metric.lastValue && typeof metric.lastValue.value === 'number') {
      const comparisonValue = metric.lastValue.value as number;
      const percentChange = comparisonValue !== 0
        ? ((currentValue - comparisonValue) / comparisonValue) * 100
        : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(percentChange) > 5) {
        trend = percentChange > 0 ? 'up' : 'down';
      }

      return {
        comparisonValue,
        percentChange: Math.round(percentChange * 10) / 10,
        trend,
      };
    }

    return {};
  }

  /**
   * Process conversational query (simplified version)
   * In production, integrate with LLM with proper guardrails
   */
  async processQuery(tenantId: string, question: string, userId: string): Promise<InsightResult> {
    // Audit log the query
    logger.info(`Conversational query from user ${userId}: ${question}`);

    // Simple keyword matching (in production, use NLP/LLM)
    const keywords = question.toLowerCase();

    let selectedMetrics: string[] = [];
    let period: { startDate?: Date; endDate?: Date } = {};

    // Match metrics based on keywords
    if (keywords.includes('headcount') || keywords.includes('employee')) {
      selectedMetrics.push('headcount');
    }
    if (keywords.includes('attrition') || keywords.includes('turnover') || keywords.includes('exit')) {
      selectedMetrics.push('attrition_rate');
    }
    if (keywords.includes('attendance') || keywords.includes('presence')) {
      selectedMetrics.push('attendance_rate');
    }
    if (keywords.includes('leave') || keywords.includes('vacation')) {
      selectedMetrics.push('leave_utilization');
    }
    if (keywords.includes('confirmation') || keywords.includes('probation')) {
      selectedMetrics.push('confirmation_pending');
    }
    if (keywords.includes('review') || keywords.includes('appraisal') || keywords.includes('performance')) {
      selectedMetrics.push('review_completion_rate');
    }

    // Parse time period
    if (keywords.includes('last month') || keywords.includes('previous month')) {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      period = { startDate: start, endDate: end };
    } else if (keywords.includes('last quarter')) {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      period = { startDate: start, endDate: end };
    }

    // If no metrics matched, return generic response
    if (selectedMetrics.length === 0) {
      return {
        question,
        answer: 'I can help you with workforce metrics like headcount, attrition, attendance, leave, confirmations, and performance reviews. Please rephrase your question.',
        metrics: [],
        followUpQuestions: [
          'What is the current headcount?',
          'Show attrition rate for last quarter',
          'What is the attendance rate this month?',
        ],
      };
    }

    // Calculate metrics
    const metrics: MetricValue[] = [];
    for (const metricName of selectedMetrics) {
      try {
        const value = await this.calculateMetric(tenantId, metricName, period);
        metrics.push(value);
      } catch (error) {
        logger.error(`Error calculating metric ${metricName}:`, error);
      }
    }

    // Generate answer
    const answer = this.generateAnswer(question, metrics);

    // Generate insights
    const insights = this.generateInsights(metrics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics);

    // Generate follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(selectedMetrics);

    return {
      question,
      answer,
      metrics,
      insights,
      recommendations,
      followUpQuestions,
    };
  }

  /**
   * Generate natural language answer
   */
  private generateAnswer(question: string, metrics: MetricValue[]): string {
    if (metrics.length === 0) {
      return 'No metrics data available for the given query.';
    }

    const parts: string[] = [];

    metrics.forEach((metric) => {
      const valueStr = typeof metric.value === 'number'
        ? metric.value.toFixed(2)
        : metric.value;

      const trendStr = metric.trend && metric.percentChange
        ? ` (${metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} ${Math.abs(metric.percentChange)}% from previous period)`
        : '';

      parts.push(`${metric.metricName.replace(/_/g, ' ')}: ${valueStr}${trendStr}`);
    });

    return parts.join('; ');
  }

  /**
   * Generate insights from metrics
   */
  private generateInsights(metrics: MetricValue[]): string[] {
    const insights: string[] = [];

    metrics.forEach((metric) => {
      if (metric.trend === 'up' && metric.metricName === 'attrition_rate') {
        insights.push(`⚠️ Attrition rate is trending upward (${metric.percentChange}% increase)`);
      }
      if (metric.trend === 'down' && metric.metricName === 'attendance_rate') {
        insights.push(`⚠️ Attendance rate is declining (${metric.percentChange}% decrease)`);
      }
      if (metric.metricName === 'confirmation_pending' && typeof metric.value === 'number' && metric.value > 10) {
        insights.push(`📋 High number of pending confirmations: ${metric.value} employees`);
      }
    });

    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(metrics: MetricValue[]): string[] {
    const recommendations: string[] = [];

    metrics.forEach((metric) => {
      if (metric.metricName === 'attrition_rate' && typeof metric.value === 'number' && metric.value > 10) {
        recommendations.push('Consider conducting exit interviews to understand attrition drivers');
      }
      if (metric.metricName === 'review_completion_rate' && typeof metric.value === 'number' && metric.value < 85) {
        recommendations.push('Send reminders to managers with pending performance reviews');
      }
    });

    return recommendations;
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(selectedMetrics: string[]): string[] {
    const questions: string[] = [];

    if (selectedMetrics.includes('attrition_rate')) {
      questions.push('Which department has the highest attrition?');
      questions.push('What is the trend over the last 6 months?');
    }

    if (selectedMetrics.includes('headcount')) {
      questions.push('Show headcount by department');
      questions.push('How has headcount changed this year?');
    }

    return questions.slice(0, 3);
  }
}

export default new AnalyticsService();
