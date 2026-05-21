import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payslip } from './Payslip';
import { SalaryComponentType } from './SalaryComponent';

@Entity('payslip_components')
@Index(['tenantId', 'payslipId'])
export class PayslipComponent {
  @PrimaryGeneratedColumn('uuid')
  componentId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  payslipId!: string;

  @ManyToOne(() => Payslip, (payslip) => payslip.components, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payslipId' })
  payslip?: Payslip;

  @Column({ type: 'varchar', length: 120 })
  componentName!: string;

  @Column({
    type: 'enum',
    enum: SalaryComponentType,
    enumName: 'payslip_component_type_enum',
    default: SalaryComponentType.EARNING,
  })
  componentType!: SalaryComponentType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount!: number;

  @Column({ type: 'int', default: 0 })
  displayOrder!: number;
}
