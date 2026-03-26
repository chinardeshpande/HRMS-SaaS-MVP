import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Role } from './Role';

export enum PermissionModule {
  DASHBOARD = 'dashboard',
  EMPLOYEES = 'employees',
  ATTENDANCE = 'attendance',
  LEAVE = 'leave',
  PAYROLL = 'payroll',
  PERFORMANCE = 'performance',
  RECRUITMENT = 'recruitment',
  ONBOARDING = 'onboarding',
  EXIT_MANAGEMENT = 'exit_management',
  DOCUMENTS = 'documents',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  HR_CONNECT = 'hr_connect',
  CALENDAR = 'calendar',
  PROJECTS = 'projects',
  ASSETS = 'assets',
  ANNOUNCEMENTS = 'announcements',
}

export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  EXPORT = 'export',
  IMPORT = 'import',
  MANAGE = 'manage',
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  permissionId: string;

  @Column({ length: 100, unique: true })
  permissionCode: string; // e.g., "employees.view", "payroll.create"

  @Column({ length: 255 })
  permissionName: string; // e.g., "View Employees", "Create Payroll"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PermissionModule,
  })
  module: PermissionModule;

  @Column({
    type: 'enum',
    enum: PermissionAction,
  })
  action: PermissionAction;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystemPermission: boolean; // Cannot be deleted

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
