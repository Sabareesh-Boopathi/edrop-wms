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

// ---- API wrappers (no client-side mocks) ----
export async function fetchPickTasks(): Promise<PickTask[]> {
  const r = await api.get('/outbound/pick-tasks');
  return r.data;
}
export async function fetchToteLocation(toteId: string): Promise<ToteLocation> {
  const r = await api.get(`/outbound/totes/${toteId}/location`);
  return r.data;
}
export async function reassignPickTask(taskId: string, picker: string): Promise<boolean> {
  await api.post(`/outbound/pick-tasks/${taskId}/reassign`, { picker });
  return true;
}
export async function cancelPickTask(taskId: string): Promise<boolean> {
  await api.post(`/outbound/pick-tasks/${taskId}/cancel`);
  return true;
}
export async function splitPickTask(taskId: string, pickers: string[]): Promise<boolean> {
  await api.post(`/outbound/pick-tasks/${taskId}/split`, { pickers });
  return true;
}

export async function fetchPackingQueue(): Promise<PackingTote[]> {
  const r = await api.get('/outbound/packing-queue');
  return r.data;
}
export async function sendBackToPicking(toteId: string): Promise<boolean> {
  await api.post(`/outbound/packing/${toteId}/send-back`);
  return true;
}
export async function reassignToteToOrder(toteId: string, orderId: string): Promise<boolean> {
  await api.post(`/outbound/packing/${toteId}/reassign`, { order_id: orderId });
  return true;
}
export async function overrideValidation(toteId: string, note: string): Promise<boolean> {
  await api.post(`/outbound/packing/${toteId}/override`, { note });
  return true;
}

export async function fetchRoutes(): Promise<RouteSummary[]> {
  const r = await api.get('/outbound/routes');
  return r.data;
}
export async function forceBinReassign(toteId: string, toBin: string): Promise<boolean> {
  await api.post('/outbound/binning/force-reassign', { tote_id: toteId, to_bin: toBin });
  return true;
}
export async function toggleRouteLock(routeId: string, lock: boolean): Promise<boolean> {
  await api.post(`/outbound/routes/${routeId}/${lock ? 'lock' : 'unlock'}`);
  return true;
}
export async function reoptimizeRoutes(): Promise<boolean> {
  await api.post('/outbound/routes/reoptimize');
  return true;
}

export async function fetchDispatchRoutes(): Promise<DispatchRoute[]> {
  const r = await api.get('/outbound/dispatch/routes');
  return r.data;
}
export async function assignDriver(routeId: string, driver: string, vehicle?: string): Promise<boolean> {
  await api.post(`/outbound/dispatch/${routeId}/assign-driver`, { driver, vehicle });
  return true;
}
export async function approveDispatch(routeId: string): Promise<boolean> {
  await api.post(`/outbound/dispatch/${routeId}/approve`);
  return true;
}
export async function holdDispatch(routeId: string): Promise<boolean> {
  await api.post(`/outbound/dispatch/${routeId}/hold`);
  return true;
}
export async function cancelVehicle(routeId: string): Promise<boolean> {
  await api.post(`/outbound/dispatch/${routeId}/cancel`);
  return true;
}
