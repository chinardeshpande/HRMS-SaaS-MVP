import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Tenant } from './Tenant';
import { Permission } from './Permission';
import { Employee } from './Employee';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  roleId: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ length: 100 })
  roleName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isSystemRole: boolean; // Cannot be deleted (e.g., Super Admin, Admin, Employee)

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  level: number; // Hierarchy level - higher is more privileged

  @ManyToMany(() => Permission, permission => permission.roles, { cascade: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'roleId' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'permissionId' },
  })
  permissions: Permission[];

  @OneToMany(() => Employee, employee => employee.role)
  employees: Employee[];

  @Column({ type: 'int', default: 0 })
  employeeCount: number;

  @Column({ type: 'jsonb', nullable: true })
  dataAccessRules: {
    ownDataOnly?: boolean;
    departmentDataOnly?: boolean;
    teamDataOnly?: boolean;
    allData?: boolean;
    specificDepartments?: string[];
    specificLocations?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  customPermissions: Record<string, boolean>; // For additional custom permissions

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
