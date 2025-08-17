import api from './api';

export type UUID = string;

// ===== Pick List =====
export type PickStatus = 'pending' | 'in_progress' | 'completed' | 'exception';
export interface PickTask {
  id: UUID;
  tote_id: string;
  order_id: UUID;
  sku_count: number;
  picker?: string;
  status: PickStatus;
  exceptions?: string[]; // item_not_found, shortage, wrong_tote, delayed
  updated_at?: string;
}
export interface ToteLocation {
  tote_id: string;
  location: 'storage' | 'on_cart' | 'staging';
  last_seen_at: string;
}

// ===== Packing =====
export type ValidationStatus = 'waiting' | 'scanning' | 'pass' | 'mismatch';
export interface PackingTote {
  tote_id: string;
  order_id: UUID;
  arrived_at: string;
  status: ValidationStatus;
  scan_logs: Array<{ ts: string; code: string; ok: boolean; note?: string }>;
}

// ===== Route Binning =====
export interface RouteBin {
  bin_id: string;
  capacity: number;
  totes: string[]; // tote ids
  locked?: boolean;
}
export interface RouteSummary {
  route_id: string;
  name: string;
  bins: RouteBin[];
  auto_slotting: boolean;
}

// ===== Dispatch =====
export type RouteState = 'pending' | 'waiting' | 'ready' | 'dispatched' | 'hold';
export interface DispatchRoute {
  route_id: string;
  name: string;
  status: RouteState;
  driver?: string;
  vehicle?: string;
  totes_loaded: number;
  totes_expected: number;
  loading_logs: Array<{ ts: string; tote_id: string; ok: boolean; note?: string }>;
}

function nowIso() { return new Date().toISOString(); }

// ---- Fallback mocks (used if API not ready) ----
const mockPickTasks: PickTask[] = [
  { id: 'pt-1', tote_id: 'TOTE-1001', order_id: 'ORD-1001', sku_count: 12, picker: 'Asha', status: 'in_progress', updated_at: nowIso() },
  { id: 'pt-2', tote_id: 'TOTE-1002', order_id: 'ORD-1002', sku_count: 8, picker: 'Vikram', status: 'pending', updated_at: nowIso(), exceptions: ['delayed'] },
  { id: 'pt-3', tote_id: 'TOTE-1003', order_id: 'ORD-1003', sku_count: 5, picker: 'Asha', status: 'completed', updated_at: nowIso() },
];
const mockToteLocation: Record<string, ToteLocation> = {
  'TOTE-1001': { tote_id: 'TOTE-1001', location: 'on_cart', last_seen_at: nowIso() },
  'TOTE-1002': { tote_id: 'TOTE-1002', location: 'storage', last_seen_at: nowIso() },
  'TOTE-1003': { tote_id: 'TOTE-1003', location: 'staging', last_seen_at: nowIso() },
};
const mockPacking: PackingTote[] = [
  { tote_id: 'TOTE-1001', order_id: 'ORD-1001', arrived_at: nowIso(), status: 'scanning', scan_logs: [{ ts: nowIso(), code: 'SKU-1', ok: true }] },
  { tote_id: 'TOTE-1004', order_id: 'ORD-1004', arrived_at: nowIso(), status: 'waiting', scan_logs: [] },
];
const mockRoutes: RouteSummary[] = [
  { route_id: 'R-10', name: 'Route 10', auto_slotting: true, bins: [
    { bin_id: 'B-101', capacity: 20, totes: ['TOTE-1001', 'TOTE-1002'] },
    { bin_id: 'B-102', capacity: 20, totes: [] },
  ]},
  { route_id: 'R-12', name: 'Route 12', auto_slotting: false, bins: [ { bin_id: 'B-201', capacity: 15, totes: ['TOTE-2001'] } ]},
];
const mockDispatch: DispatchRoute[] = [
  { route_id: 'R-10', name: 'Route 10', status: 'ready', driver: 'Mohit', vehicle: 'MH12 AB 1234', totes_loaded: 12, totes_expected: 14, loading_logs: [{ ts: nowIso(), tote_id: 'TOTE-1001', ok: true }] },
  { route_id: 'R-12', name: 'Route 12', status: 'waiting', driver: undefined, vehicle: undefined, totes_loaded: 3, totes_expected: 10, loading_logs: [] },
];

// ---- API wrappers with graceful fallback ----
export async function fetchPickTasks(): Promise<PickTask[]> {
  try { const r = await api.get('/outbound/pick-tasks'); return r.data; } catch { return mockPickTasks; }
}
export async function fetchToteLocation(toteId: string): Promise<ToteLocation> {
  try { const r = await api.get(`/outbound/totes/${toteId}/location`); return r.data; } catch { return mockToteLocation[toteId] || { tote_id: toteId, location: 'storage', last_seen_at: nowIso() }; }
}
export async function reassignPickTask(taskId: string, picker: string) { try { await api.post(`/outbound/pick-tasks/${taskId}/reassign`, { picker }); return true; } catch { return true; } }
export async function cancelPickTask(taskId: string) { try { await api.post(`/outbound/pick-tasks/${taskId}/cancel`); return true; } catch { return true; } }
export async function splitPickTask(taskId: string, pickers: string[]) { try { await api.post(`/outbound/pick-tasks/${taskId}/split`, { pickers }); return true; } catch { return true; } }

export async function fetchPackingQueue(): Promise<PackingTote[]> { try { const r = await api.get('/outbound/packing-queue'); return r.data; } catch { return mockPacking; } }
export async function sendBackToPicking(toteId: string) { try { await api.post(`/outbound/packing/${toteId}/send-back`); return true; } catch { return true; } }
export async function reassignToteToOrder(toteId: string, orderId: string) { try { await api.post(`/outbound/packing/${toteId}/reassign`, { order_id: orderId }); return true; } catch { return true; } }
export async function overrideValidation(toteId: string, note: string) { try { await api.post(`/outbound/packing/${toteId}/override`, { note }); return true; } catch { return true; } }

export async function fetchRoutes(): Promise<RouteSummary[]> { try { const r = await api.get('/outbound/routes'); return r.data; } catch { return mockRoutes; } }
export async function forceBinReassign(toteId: string, toBin: string) { try { await api.post('/outbound/binning/force-reassign', { tote_id: toteId, to_bin: toBin }); return true; } catch { return true; } }
export async function toggleRouteLock(routeId: string, lock: boolean) { try { await api.post(`/outbound/routes/${routeId}/${lock ? 'lock' : 'unlock'}`); return true; } catch { return true; } }
export async function reoptimizeRoutes() { try { await api.post('/outbound/routes/reoptimize'); return true; } catch { return true; } }

export async function fetchDispatchRoutes(): Promise<DispatchRoute[]> { try { const r = await api.get('/outbound/dispatch/routes'); return r.data; } catch { return mockDispatch; } }
export async function assignDriver(routeId: string, driver: string, vehicle?: string) { try { await api.post(`/outbound/dispatch/${routeId}/assign-driver`, { driver, vehicle }); return true; } catch { return true; } }
export async function approveDispatch(routeId: string) { try { await api.post(`/outbound/dispatch/${routeId}/approve`); return true; } catch { return true; } }
export async function holdDispatch(routeId: string) { try { await api.post(`/outbound/dispatch/${routeId}/hold`); return true; } catch { return true; } }
export async function cancelVehicle(routeId: string) { try { await api.post(`/outbound/dispatch/${routeId}/cancel`); return true; } catch { return true; } }
