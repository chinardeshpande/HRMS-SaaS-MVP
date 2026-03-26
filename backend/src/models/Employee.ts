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
import { Department } from './Department';
import { Designation } from './Designation';
import { Role } from './Role';
import { EmploymentStatus } from '../../../shared/types';

@Entity('employees')
@Index(['tenantId', 'employeeCode'], { unique: true })
@Index(['tenantId', 'email'], { unique: true })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  employeeId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 50 })
  employeeCode!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  // Job Information
  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @Column({ type: 'uuid', nullable: true })
  designationId?: string;

  @Column({ type: 'uuid', nullable: true })
  managerId?: string;

  @Column({ type: 'uuid', nullable: true })
  roleId?: string;

  @Column({ type: 'date' })
  dateOfJoining!: Date;

  @Column({ type: 'date', nullable: true })
  probationEndDate?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employmentType?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
    enum: ['active', 'inactive', 'exited'],
  })
  @Index()
  status!: EmploymentStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Department, (department) => department.employees, {
    nullable: true,
  })
  @JoinColumn({ name: 'departmentId' })
  department?: Department;

  @ManyToOne(() => Designation, (designation) => designation.employees, {
    nullable: true,
  })
  @JoinColumn({ name: 'designationId' })
  designation?: Designation;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'managerId' })
  manager?: Employee;

  @ManyToOne(() => Role, (role) => role.employees, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  @OneToMany(() => Employee, (employee) => employee.manager)
  subordinates?: Employee[];

  // Computed property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
