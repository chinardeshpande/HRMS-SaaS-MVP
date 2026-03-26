import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_ACCOUNT = 'bank_account',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
}

export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
  DINERS = 'diners',
  JCB = 'jcb',
  UNIONPAY = 'unionpay',
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  paymentMethodId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
  })
  type!: PaymentMethodType;

  @Column({ default: false })
  isDefault!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  // Card Details (encrypted/tokenized in production)
  @Column({ type: 'varchar', length: 255, nullable: true })
  cardLast4?: string;

  @Column({
    type: 'enum',
    enum: CardBrand,
    nullable: true,
  })
  cardBrand?: CardBrand;

  @Column({ type: 'varchar', length: 2, nullable: true })
  expiryMonth?: string; // MM format

  @Column({ type: 'varchar', length: 4, nullable: true })
  expiryYear?: string; // YYYY format

  @Column({ type: 'varchar', length: 255, nullable: true })
  cardholderName?: string;

  // Bank Account Details
  @Column({ type: 'varchar', length: 255, nullable: true })
  bankName?: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  accountLast4?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  accountType?: string; // checking, savings

  @Column({ type: 'varchar', length: 255, nullable: true })
  routingNumber?: string;

  // Billing Address
  @Column({ type: 'text', nullable: true })
  billingAddress?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  billingCity?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  billingState?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  billingZip?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  billingCountry?: string;

  // Payment Gateway Integration
  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentMethodId?: string; // Stripe payment method ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId?: string; // Stripe customer ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  paypalEmail?: string; // PayPal account email

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  nickname?: string; // User-friendly name like "Personal Visa"

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
