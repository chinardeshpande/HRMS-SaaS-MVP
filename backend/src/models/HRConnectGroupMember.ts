import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Tenant } from './Tenant';
import { Employee } from './Employee';
import { HRConnectGroup } from './HRConnectGroup';

export enum MemberRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

@Entity('hr_connect_group_members')
@Index(['tenantId', 'groupId'])
@Index(['tenantId', 'employeeId'])
@Unique(['groupId', 'employeeId'])
export class HRConnectGroupMember {
  @PrimaryGeneratedColumn('uuid')
  memberId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @Column('uuid')
  @Index()
  groupId!: string;

  @ManyToOne(() => HRConnectGroup, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: HRConnectGroup;

  @Column('uuid')
  @Index()
  employeeId!: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @Column({
    type: 'enum',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  role!: MemberRole;

  @Column({ type: 'boolean', default: true })
  receiveNotifications!: boolean;

  @CreateDateColumn()
  joinedAt!: Date;
}
