import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Tenant } from './Tenant';
import { Employee } from './Employee';
import { Department } from './Department';
import { HRConnectGroupMember } from './HRConnectGroupMember';
import { HRConnectPost } from './HRConnectPost';

export enum GroupType {
  DEPARTMENT = 'department',
  TOPIC = 'topic',
  PROJECT = 'project',
  SOCIAL = 'social',
}

export enum GroupPrivacy {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SECRET = 'secret',
}

@Entity('hr_connect_groups')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'groupType'])
export class HRConnectGroup {
  @PrimaryGeneratedColumn('uuid')
  groupId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: GroupType,
    default: GroupType.TOPIC,
  })
  groupType!: GroupType;

  @Column({
    type: 'enum',
    enum: GroupPrivacy,
    default: GroupPrivacy.PUBLIC,
  })
  privacy!: GroupPrivacy;

  @Column('uuid')
  createdBy!: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator!: Employee;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department?: Department;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImage?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon?: string;

  @Column({ type: 'int', default: 0 })
  memberCount!: number;

  @Column({ type: 'int', default: 0 })
  postCount!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => HRConnectGroupMember, (member) => member.group)
  members!: HRConnectGroupMember[];

  @OneToMany(() => HRConnectPost, (post) => post.group)
  posts!: HRConnectPost[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
