import { AppDataSource } from '../config/database';
import { AuditLog } from '../models/AuditLog';

export interface AuditInput {
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  private auditLogRepo = AppDataSource.getRepository(AuditLog);

  async record(input: AuditInput): Promise<void> {
    const auditLog = this.auditLogRepo.create(input);
    await this.auditLogRepo.save(auditLog);
  }
}

export const auditService = new AuditService();
export default auditService;

