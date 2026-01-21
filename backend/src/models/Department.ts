import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from './Employee';

@Entity('departments')
@Index(['tenantId', 'name'], { unique: true })
export class Department {
  @PrimaryGeneratedColumn('uuid')
  departmentId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'uuid', nullable: true })
  parentDeptId?: string;

  @Column({ type: 'uuid', nullable: true })
  headEmployeeId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'parentDeptId' })
  parentDepartment?: Department;

  @OneToMany(() => Department, (dept) => dept.parentDepartment)
  subDepartments?: Department[];

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'headEmployeeId' })
  headEmployee?: Employee;

  @OneToMany(() => Employee, (employee) => employee.department)
  employees?: Employee[];
}
