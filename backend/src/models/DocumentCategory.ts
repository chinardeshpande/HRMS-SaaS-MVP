import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('document_category')
@Index(['tenantId', 'name'], { unique: true })
export class DocumentCategory {
  @PrimaryGeneratedColumn('uuid')
  categoryId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color?: string; // For UI color coding

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string; // Icon name for UI

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean; // System-defined categories

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
