import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';
import { Department } from './Department';
import { Designation } from './Designation';
import { Employee } from './Employee';
import { OnboardingState } from './enums/OnboardingState';

@Entity('candidates')
@Index(['tenantId', 'email'], { unique: true })
@Index(['tenantId', 'currentState'])
@Index(['tenantId', 'expectedJoinDate'])
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  candidateId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: OnboardingState,
    default: OnboardingState.OFFER_APPROVED,
  })
  currentState!: OnboardingState;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @Column({ type: 'uuid', nullable: true })
  designationId?: string;

  @Column({ type: 'uuid', nullable: true })
  reportingManagerId?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  offeredSalary!: number;

  @Column({ length: 3, default: 'INR' })
  currency!: string;

  @Column({ type: 'date' })
  expectedJoinDate!: Date;

  @Column({ type: 'date', nullable: true })
  actualJoinDate?: Date;

  @Column({ type: 'date', nullable: true })
  offerSentDate?: Date;

  @Column({ type: 'date', nullable: true })
  offerAcceptedDate?: Date;

  @Column({ type: 'date', nullable: true })
  offerExpiryDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  employeeId?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department?: Department;

  @ManyToOne(() => Designation, { nullable: true })
  @JoinColumn({ name: 'designationId' })
  designation?: Designation;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'reportingManagerId' })
  reportingManager?: Employee;

  @OneToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;
}
