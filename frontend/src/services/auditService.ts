import api from './api';

export interface AuditChangeEntry {
  before: unknown;
  after: unknown;
}

export interface AuditLogItem {
  id: string;
  actor_user_id: string;
  actor_name?: string;
  actor_role?: string;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  changes: Record<string, AuditChangeEntry>;
  created_at: string;
}

export const getSystemAudit = async (limit = 100): Promise<AuditLogItem[]> => {
  const res = await api.get('/system/audit', { params: { limit } });
  return res.data;
};
