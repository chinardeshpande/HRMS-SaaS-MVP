import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';

export enum MetricCategory {
  WORKFORCE = 'workforce',
  ATTENDANCE = 'attendance',
  LEAVE = 'leave',
  PERFORMANCE = 'performance',
  ATTRITION = 'attrition',
  ONBOARDING = 'onboarding',
  CONFIRMATION = 'confirmation',
  COMPLIANCE = 'compliance',
}

export enum MetricType {
  COUNT = 'count',
  PERCENTAGE = 'percentage',
  RATE = 'rate',
  AVERAGE = 'average',
  TREND = 'trend',
  DISTRIBUTION = 'distribution',
}

export enum AggregationMethod {
  SUM = 'sum',
  COUNT = 'count',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  DISTINCT_COUNT = 'distinct_count',
}

@Entity('analytics_metrics')
@Index(['tenantId', 'metricName'], { unique: true })
@Index(['tenantId', 'category'])
@Index(['tenantId', 'isActive'])
export class AnalyticsMetric {
  @PrimaryGeneratedColumn('uuid')
  metricId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 100 })
  metricName!: string;

  @Column({ type: 'varchar', length: 200 })
  displayName!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: MetricCategory,
  })
  category!: MetricCategory;

  @Column({
    type: 'enum',
    enum: MetricType,
  })
  metricType!: MetricType;

  @Column({
    type: 'enum',
    enum: AggregationMethod,
  })
  aggregation!: AggregationMethod;

  @Column({ type: 'jsonb' })
  queryConfig!: {
    sourceTable: string;
    selectFields: string[];
    groupBy?: string[];
    filters?: Record<string, any>;
    joins?: Array<{
      table: string;
      on: string;
      type?: 'INNER' | 'LEFT' | 'RIGHT';
    }>;
    orderBy?: Record<string, 'ASC' | 'DESC'>;
  };

  @Column({ type: 'jsonb', nullable: true })
  dimensions?: {
    available: string[];
    default?: string;
  };

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit?: string;

  @Column({ type: 'jsonb', nullable: true })
  thresholds?: {
    critical?: number;
    warning?: number;
    good?: number;
  };

  @Column({ type: 'text', nullable: true })
  formula?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'simple-array', nullable: true })
  synonyms?: string[];

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isCustom!: boolean;

  @Column({ type: 'integer', default: 0 })
  usageCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastCalculatedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  lastValue?: {
    value: number | string;
    calculatedAt: string;
    period?: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;
}
