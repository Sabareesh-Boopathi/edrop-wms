// frontend/src/types.ts

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  is_read: boolean;
  milestone_id?: string;
  created_at: string;
}

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

// Restrict to backend-supported enums
export const CRATE_STATUSES = ['active', 'in_use', 'reserved', 'damaged', 'inactive'] as const;
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

// ========================
// Bin Management Types
// ========================
export type BinStatus = 'empty' | 'occupied' | 'reserved' | 'blocked' | 'maintenance';
export type RackStatus = 'active' | 'maintenance' | 'inactive';

export interface Rack {
  id: string;
  name: string;
  warehouse_id: string;
  stacks: number; // rows
  bins_per_stack: number; // columns
  total_bins: number; // stacks * bins_per_stack
  occupied_bins: number;
  description?: string;
  status?: RackStatus;
}

export interface Bin {
  id: string;
  rack_id: string;
  stack_index: number; // row index (0-based)
  bin_index: number; // column index (0-based)
  code?: string;
  status: BinStatus;
  crate_id?: string;
  product_id?: string;
  store_product_id?: string;
  quantity?: number;
  updated_at?: string;
}