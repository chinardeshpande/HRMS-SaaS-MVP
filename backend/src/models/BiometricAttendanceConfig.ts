import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export interface BiometricColumnMapping {
  employeeCode: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  workMinutes: string;
  location: string;
  notes: string;
}

@Entity('biometric_attendance_configs')
@Index(['tenantId'], { unique: true })
export class BiometricAttendanceConfig {
  @PrimaryGeneratedColumn('uuid')
  configId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 100, default: 'Default biometric format' })
  formatName!: string;

  @Column({ type: 'int', default: 1 })
  headerRow!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sheetName?: string;

  @Column({ type: 'jsonb' })
  columnMapping!: BiometricColumnMapping;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
