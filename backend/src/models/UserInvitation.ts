import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';
import { User } from './User';
import { UserRole } from '../../../shared/types';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('user_invitations')
export class UserInvitation {
  @PrimaryGeneratedColumn('uuid')
  invitationId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  fullName!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role!: UserRole;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @Column({ type: 'uuid' })
  invitedBy!: string; // User ID who sent the invitation

  @Column({ type: 'varchar', length: 255, unique: true })
  invitationToken!: string;

  @Column({ type: 'timestamp' })
  tokenExpiry!: Date;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitedBy' })
  inviter?: User;
}
