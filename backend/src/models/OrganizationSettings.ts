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

@Entity('organization_settings')
export class OrganizationSettings {
  @PrimaryGeneratedColumn('uuid')
  settingId: string;

  @Column({ unique: true })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // Company Information
  @Column({ length: 255 })
  companyName: string;

  @Column({ type: 'text', nullable: true })
  companyDescription: string;

  @Column({ length: 255, nullable: true })
  industry: string;

  @Column({ length: 20, nullable: true })
  registrationNumber: string;

  @Column({ length: 20, nullable: true })
  taxId: string;

  @Column({ type: 'text', nullable: true })
  logo: string;

  // Contact Information
  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  state: string;

  @Column({ length: 20, nullable: true })
  postalCode: string;

  @Column({ length: 100, nullable: true })
  country: string;

  // Operational Settings
  @Column({ length: 50, default: 'UTC' })
  timezone: string;

  @Column({ length: 10, default: 'en' })
  defaultLanguage: string;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({ length: 20, default: 'MM/DD/YYYY' })
  dateFormat: string;

  @Column({ length: 20, default: '12h' })
  timeFormat: string;

  @Column({ type: 'int', default: 1 })
  fiscalYearStartMonth: number;

  @Column({ type: 'int', default: 0 })
  weekStartDay: number; // 0 = Sunday, 1 = Monday, etc.

  // Working Hours
  @Column({ type: 'jsonb', nullable: true })
  workingHours: {
    monday: { enabled: boolean; start: string; end: string };
    tuesday: { enabled: boolean; start: string; end: string };
    wednesday: { enabled: boolean; start: string; end: string };
    thursday: { enabled: boolean; start: string; end: string };
    friday: { enabled: boolean; start: string; end: string };
    saturday: { enabled: boolean; start: string; end: string };
    sunday: { enabled: boolean; start: string; end: string };
  };

  // Notification Settings
  @Column({ type: 'jsonb', nullable: true })
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    slackIntegration: boolean;
    teamsIntegration: boolean;
  };

  // Security Settings
  @Column({ default: true })
  twoFactorAuthRequired: boolean;

  @Column({ type: 'int', default: 30 })
  passwordExpiryDays: number;

  @Column({ type: 'int', default: 5 })
  maxLoginAttempts: number;

  @Column({ type: 'int', default: 30 })
  sessionTimeoutMinutes: number;

  @Column({ default: false })
  ipWhitelistEnabled: boolean;

  @Column({ type: 'simple-array', nullable: true })
  allowedIpAddresses: string[];

  // Customization
  @Column({ type: 'jsonb', nullable: true })
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string;
    faviconUrl: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
