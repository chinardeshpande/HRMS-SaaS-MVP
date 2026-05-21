import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SalaryStructure } from './SalaryStructure';

export enum SalaryComponentType {
  EARNING = 'earning',
  DEDUCTION = 'deduction',
  EMPLOYER_CONTRIBUTION = 'employer_contribution',
}

@Entity('salary_components')
@Index(['tenantId', 'salaryStructureId'])
export class SalaryComponent {
  @PrimaryGeneratedColumn('uuid')
  componentId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  salaryStructureId!: string;

  @ManyToOne(() => SalaryStructure, (salaryStructure) => salaryStructure.components, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'salaryStructureId' })
  salaryStructure?: SalaryStructure;

  @Column({ type: 'varchar', length: 120 })
  componentName!: string;

  @Column({
    type: 'enum',
    enum: SalaryComponentType,
    enumName: 'salary_component_type_enum',
    default: SalaryComponentType.EARNING,
  })
  componentType!: SalaryComponentType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  monthlyAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  annualAmount!: number;

  @Column({ type: 'boolean', default: true })
  taxable!: boolean;

  @Column({ type: 'boolean', default: false })
  statutory!: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder!: number;
}
