import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import bcrypt from 'bcrypt';
import { Tenant } from './Tenant';
import { Employee } from './Employee';
import { UserRole } from '../../../shared/types';

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 255 })
  fullName!: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: ['employee', 'manager', 'hr_admin', 'system_admin'],
  })
  role!: UserRole;

  @Column({ type: 'uuid', nullable: true })
  employeeId?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  // Virtual field for password (not stored in DB)
  password?: string;

  // Hash password before insert/update
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.password, salt);
      delete this.password; // Remove plain password
    }
  }

  // Method to verify password
  async verifyPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.passwordHash);
  }

  // Method to sanitize user data (remove password hash)
  toJSON() {
    const { passwordHash, password, ...user } = this as any;
    return user;
  }
}
