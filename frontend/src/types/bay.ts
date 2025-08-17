export type VehicleSize = 'SMALL'|'MEDIUM'|'LARGE';
export type VehicleType = 'VAN_S'|'TRUCK_M'|'TRUCK_L';
export type BayType = 'GOODS_IN'|'GOODS_OUT'|'DYNAMIC'|'PARKING';
export type BayStatus = 'EMPTY'|'RESERVED'|'VEHICLE_PRESENT'|'MAINTENANCE';

export interface Bay {
  id: string;
  name: string;
  // Scope bay to a warehouse
  warehouse_id: string;
  type: BayType;
  dynamicMode?: 'GOODS_IN'|'GOODS_OUT';
  capacity: number;
  vehicleCompat: VehicleSize[];
  status: BayStatus;
  reserved_for?: { ref: string; direction: 'IN'|'OUT'; eta?: string };
  vehicle?: { reg: string; type: VehicleType; carrier?: string; vendor?: string };
  operation?: 'UNLOADING'|'LOADING';
  progressPct?: number;
  utilizationPct?: number;
  created_at: string;
  updated_at: string;
}

export interface BayKpis {
  total: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  empty: number;
  utilization: number; // avg across bays
  averageTurnaroundMin: number;
  idleRatePct: number;
  efficiencyPct: number;
}
