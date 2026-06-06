import { Injectable } from '@nestjs/common';
import { PlatformAuditService } from '@/modules/platform-metrics/services/platform-audit.service';
import type { AdminAuditPageDto, AdminAuditQueryDto } from '../dtos/admin-audit.dto';

@Injectable()
export class AdminAuditService {
  constructor(private readonly platformAuditService: PlatformAuditService) {}

  async listAdminAudit(query: AdminAuditQueryDto): Promise<AdminAuditPageDto> {
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;
    return this.platformAuditService.listAdminAuditLog(limit, offset);
  }

  async listUserAudit(userId: string, query: AdminAuditQueryDto): Promise<AdminAuditPageDto> {
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;
    return this.platformAuditService.listUserAuditLog(userId, limit, offset);
  }
}
