import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum PayrollTaxStatementStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  VERIFIED = 'verified',
  SHARED = 'shared',
}

@Entity('payroll_tax_statements')
@Index(['tenantId', 'employeeId', 'financialYear', 'statementType'], { unique: true })
export class PayrollTaxStatement {
  @PrimaryGeneratedColumn('uuid')
  payrollTaxStatementId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  employeeId!: string;

  @Column({ type: 'varchar', length: 20 })
  financialYear!: string;

  @Column({ type: 'varchar', length: 50 })
  statementType!: string;

  @Column({ type: 'varchar', length: 30, default: PayrollTaxStatementStatus.PENDING })
  status!: PayrollTaxStatementStatus;

  @Column({ type: 'varchar', length: 160, nullable: true })
  partnerReference?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
