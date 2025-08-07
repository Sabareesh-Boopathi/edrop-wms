// frontend/src/types.ts

export interface Milestone {
  id: string;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  milestone_value: number;
  description?: string;
  timestamp: string;
  auto_triggered: boolean;
  user_id?: string;
}

export type CrateStatus = typeof CRATE_STATUSES[number];
export type CrateType = typeof CRATE_TYPES[number];

export const CRATE_STATUSES = ['available', 'in_use', 'maintenance', 'unavailable', 'active', 'reserved', 'damaged', 'inactive'] as const;
export const CRATE_TYPES = ['standard', 'refrigerated', 'large'] as const;

export interface Crate {
  id: string;
  name: string;
  qr_code: string;
  status: CrateStatus;
  type: CrateType;
  warehouse_id: string;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface BulkCrate {
    name: string;
    qr_code: string;
}