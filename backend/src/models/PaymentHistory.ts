import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';
import { Subscription } from './Subscription';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
  UPI = 'upi',
  WALLET = 'wallet',
}

@Entity('payment_history')
export class PaymentHistory {
  @PrimaryGeneratedColumn('uuid')
  paymentId: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  subscriptionId: string;

  @ManyToOne(() => Subscription, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column({ length: 50, unique: true })
  invoiceNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({ length: 255, nullable: true })
  transactionId: string;

  @Column({ length: 255, nullable: true })
  paymentGatewayId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  billingPeriodStart: Date;

  @Column({ type: 'date' })
  billingPeriodEnd: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'text', nullable: true })
  invoiceUrl: string;

  @Column({ type: 'text', nullable: true })
  receiptUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    cardLast4?: string;
    cardBrand?: string;
    bankName?: string;
    upiId?: string;
    paymentIntentId?: string;
    customerEmail?: string;
    billingAddress?: Record<string, any>;
  };

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
