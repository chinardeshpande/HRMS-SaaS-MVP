import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './Employee';
import { User } from './User';
import { EmployeeDocument } from './EmployeeDocument';

export enum EmployeeDocumentRequestStatus {
  REQUESTED = 'requested',
  IN_PROGRESS = 'in_progress',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('employee_document_requests')
@Index(['tenantId', 'employeeId', 'status'])
export class EmployeeDocumentRequest {
  @PrimaryGeneratedColumn('uuid') requestId!: string;
  @Column({ type: 'uuid' }) @Index() tenantId!: string;
  @Column({ type: 'uuid' }) @Index() employeeId!: string;
  @Column({ type: 'uuid' }) requestedBy!: string;
  @Column({ type: 'varchar', length: 80 }) documentType!: string;
  @Column({ type: 'varchar', length: 30, default: 'employment' }) purpose!: 'employment' | 'exit';
  @Column({ type: 'text', nullable: true }) details?: string | null;
  @Column({ type: 'varchar', length: 30, default: EmployeeDocumentRequestStatus.REQUESTED }) status!: EmployeeDocumentRequestStatus;
  @Column({ type: 'text', nullable: true }) responseNotes?: string | null;
  @Column({ type: 'uuid', nullable: true }) fulfilledDocumentId?: string | null;
  @Column({ type: 'uuid', nullable: true }) resolvedBy?: string | null;
  @Column({ type: 'timestamp', nullable: true }) resolvedAt?: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'employeeId' }) employee?: Employee;
  @ManyToOne(() => User) @JoinColumn({ name: 'requestedBy' }) requester?: User;
  @ManyToOne(() => EmployeeDocument, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'fulfilledDocumentId' }) fulfilledDocument?: EmployeeDocument | null;
}
