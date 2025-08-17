// Bay management mock service. Wire to backend when available.
import { Bay, BayKpis } from 'types/bay';

let bays: Bay[] = [];

function seed() {
  if (bays.length) return;
  const now = Date.now();
  bays = [
  { id: 'BAY-01', name: 'Gate A1', warehouse_id: 'WH-01', type: 'GOODS_IN', capacity: 1, vehicleCompat: ['SMALL','MEDIUM'], status: 'EMPTY', created_at: new Date(now-86400000).toISOString(), updated_at: new Date(now-3600000).toISOString(), utilizationPct: 42 },
  { id: 'BAY-02', name: 'Gate A2', warehouse_id: 'WH-01', type: 'GOODS_IN', capacity: 1, vehicleCompat: ['MEDIUM','LARGE'], status: 'RESERVED', reserved_for: { ref: 'RCPT-1001', direction: 'IN', eta: new Date(now+3600_000).toISOString() }, created_at: new Date(now-172800000).toISOString(), updated_at: new Date(now-600000).toISOString(), utilizationPct: 55 },
  { id: 'BAY-03', name: 'Dock B1', warehouse_id: 'WH-02', type: 'DYNAMIC', dynamicMode: 'GOODS_OUT', capacity: 1, vehicleCompat: ['LARGE'], status: 'VEHICLE_PRESENT', vehicle: { reg: 'TN09 AB 2233', type: 'TRUCK_L', carrier: 'BlueDart', vendor: 'Fresh Flats' }, operation: 'LOADING', progressPct: 65, created_at: new Date(now-259200000).toISOString(), updated_at: new Date(now-120000).toISOString(), utilizationPct: 71 },
  { id: 'BAY-04', name: 'Dock B2', warehouse_id: 'WH-02', type: 'GOODS_OUT', capacity: 1, vehicleCompat: ['SMALL','MEDIUM'], status: 'MAINTENANCE', created_at: new Date(now-604800000).toISOString(), updated_at: new Date(now-230000).toISOString(), utilizationPct: 18 },
  { id: 'BAY-05', name: 'Gate A3', warehouse_id: 'WH-01', type: 'GOODS_IN', capacity: 1, vehicleCompat: ['SMALL'], status: 'VEHICLE_PRESENT', vehicle: { reg: 'KA03 XY 1234', type: 'VAN_S', carrier: 'Delhivery' }, operation: 'UNLOADING', progressPct: 30, created_at: new Date(now-7200000).toISOString(), updated_at: new Date(now-600000).toISOString(), utilizationPct: 63 },
  { id: 'BAY-06', name: 'Dock C1', warehouse_id: 'WH-02', type: 'GOODS_OUT', capacity: 1, vehicleCompat: ['MEDIUM','LARGE'], status: 'EMPTY', created_at: new Date(now-8640000).toISOString(), updated_at: new Date(now-8600000).toISOString(), utilizationPct: 33 },
  { id: 'BAY-07', name: 'Dock C2', warehouse_id: 'WH-02', type: 'DYNAMIC', dynamicMode: 'GOODS_IN', capacity: 1, vehicleCompat: ['MEDIUM'], status: 'RESERVED', reserved_for: { ref: 'RCPT-1010', direction: 'IN', eta: new Date(now+5400000).toISOString() }, created_at: new Date(now-5400000).toISOString(), updated_at: new Date(now-300000).toISOString(), utilizationPct: 48 },
  { id: 'BAY-08', name: 'Gate B3', warehouse_id: 'WH-01', type: 'GOODS_IN', capacity: 1, vehicleCompat: ['LARGE'], status: 'EMPTY', created_at: new Date(now-19000000).toISOString(), updated_at: new Date(now-150000).toISOString(), utilizationPct: 27 },
  { id: 'BAY-09', name: 'Dock D1', warehouse_id: 'WH-02', type: 'GOODS_OUT', capacity: 1, vehicleCompat: ['SMALL','MEDIUM'], status: 'VEHICLE_PRESENT', vehicle: { reg: 'MH12 ZZ 9999', type: 'TRUCK_M', carrier: 'EcomExpress' }, operation: 'LOADING', progressPct: 85, created_at: new Date(now-36000000).toISOString(), updated_at: new Date(now-60000).toISOString(), utilizationPct: 82 },
  { id: 'BAY-10', name: 'Gate A4', warehouse_id: 'WH-01', type: 'GOODS_IN', capacity: 1, vehicleCompat: ['SMALL','MEDIUM'], status: 'MAINTENANCE', created_at: new Date(now-46000000).toISOString(), updated_at: new Date(now-1200000).toISOString(), utilizationPct: 12 },
  // Parking bays (overflow)
  { id: 'PK-01', name: 'Parking P1', warehouse_id: 'WH-01', type: 'PARKING', capacity: 2, vehicleCompat: ['SMALL','MEDIUM','LARGE'], status: 'EMPTY', created_at: new Date(now-96000000).toISOString(), updated_at: new Date(now-900000).toISOString(), utilizationPct: 5 },
  { id: 'PK-02', name: 'Parking P2', warehouse_id: 'WH-02', type: 'PARKING', capacity: 2, vehicleCompat: ['SMALL','MEDIUM','LARGE'], status: 'RESERVED', reserved_for: { ref: 'RCPT-1020', direction: 'IN', eta: new Date(now+7200000).toISOString() }, created_at: new Date(now-86000000).toISOString(), updated_at: new Date(now-800000).toISOString(), utilizationPct: 8 },
  ];
}

export async function listBays(): Promise<Bay[]> { seed(); return [...bays]; }

export async function listBaysByWarehouse(warehouseId: string): Promise<Bay[]> {
  seed();
  const scoped = bays.filter(b => b.warehouse_id === warehouseId);
  if (scoped.length) return scoped;
  // For visualization: if unknown warehouse, clone seed into this warehouse context
  return bays.map(b => ({ ...b, warehouse_id: warehouseId }));
}

export async function createBay(payload: Omit<Bay, 'created_at'|'updated_at'|'utilizationPct'>): Promise<Bay> {
  seed();
  const now = new Date().toISOString();
  const bay: Bay = { ...payload, utilizationPct: 0, created_at: now, updated_at: now };
  bays.push(bay); return bay;
}

export async function updateBay(id: string, patch: Partial<Bay>): Promise<Bay | undefined> {
  seed();
  const idx = bays.findIndex(b => b.id === id);
  if (idx === -1) return undefined;
  bays[idx] = { ...bays[idx], ...patch, updated_at: new Date().toISOString() };
  return bays[idx];
}

export async function deleteBay(id: string): Promise<boolean> {
  seed();
  const len = bays.length;
  bays = bays.filter(b => b.id !== id);
  return bays.length < len;
}

export async function assignBay(id: string, params: { direction: 'IN'|'OUT'; ref: string; eta?: string; vehicle?: Bay['vehicle']; operation?: 'UNLOADING'|'LOADING' }): Promise<Bay | undefined> {
  const b = await updateBay(id, { status: 'RESERVED', reserved_for: { ref: params.ref, direction: params.direction, eta: params.eta }, vehicle: params.vehicle, operation: params.operation });
  return b;
}

export async function vehicleArrived(id: string): Promise<Bay | undefined> {
  const bay = bays.find(b => b.id === id);
  if (!bay) return undefined;
  bay.status = 'VEHICLE_PRESENT';
  bay.progressPct = 0;
  bay.updated_at = new Date().toISOString();
  return bay;
}

export async function releaseBay(id: string): Promise<Bay | undefined> {
  const bay = bays.find(b => b.id === id);
  if (!bay) return undefined;
  bay.status = 'EMPTY';
  bay.vehicle = undefined;
  bay.reserved_for = undefined;
  bay.operation = undefined;
  bay.progressPct = undefined;
  bay.updated_at = new Date().toISOString();
  return bay;
}

export async function switchDynamicType(id: string): Promise<Bay | undefined> {
  const bay = bays.find(b => b.id === id);
  if (!bay || bay.type !== 'DYNAMIC') return bay;
  bay.dynamicMode = bay.dynamicMode === 'GOODS_IN' ? 'GOODS_OUT' : 'GOODS_IN';
  bay.updated_at = new Date().toISOString();
  return bay;
}

export async function toggleMaintenance(id: string): Promise<Bay | undefined> {
  const bay = bays.find(b => b.id === id);
  if (!bay) return undefined;
  bay.status = bay.status === 'MAINTENANCE' ? 'EMPTY' : 'MAINTENANCE';
  bay.updated_at = new Date().toISOString();
  return bay;
}

export async function computeBayKpis(warehouseId?: string): Promise<BayKpis> {
  seed();
  let scope = warehouseId ? bays.filter(b => b.warehouse_id === warehouseId) : bays;
  if (warehouseId && scope.length === 0) scope = bays; // fallback in mock
  const total = scope.length;
  const occupied = scope.filter(b => b.status === 'VEHICLE_PRESENT').length;
  const reserved = scope.filter(b => b.status === 'RESERVED').length;
  const maintenance = scope.filter(b => b.status === 'MAINTENANCE').length;
  const empty = scope.filter(b => b.status === 'EMPTY').length;
  const utilization = Math.round(scope.reduce((acc, b) => acc + (b.utilizationPct || 0), 0) / Math.max(1,total));
  // Mock turnarounds
  const averageTurnaroundMin = 48; // placeholder
  const idleRatePct = Math.round((empty / Math.max(1,total)) * 100);
  const efficiencyPct = Math.min(100, Math.round((occupied * 0.7 + reserved * 0.3) / Math.max(1,total) * 100));
  return { total, occupied, reserved, maintenance, empty, utilization, averageTurnaroundMin, idleRatePct, efficiencyPct };
}
