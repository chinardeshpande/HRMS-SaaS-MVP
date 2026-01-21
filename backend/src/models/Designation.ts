import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Employee } from './Employee';

@Entity('designations')
@Index(['tenantId', 'name'], { unique: true })
export class Designation {
  @PrimaryGeneratedColumn('uuid')
  designationId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'int', nullable: true })
  level?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Employee, (employee) => employee.designation)
  employees?: Employee[];
}
