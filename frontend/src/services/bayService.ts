import api from './api';
import { Bay, BayKpis } from 'types/bay';

export async function listBays(): Promise<Bay[]> {
  const r = await api.get('/bays');
  return r.data;
}

export async function listBaysByWarehouse(warehouseId: string): Promise<Bay[]> {
  const r = await api.get('/bays', { params: { warehouse_id: warehouseId } });
  return r.data;
}

export async function createBay(payload: Omit<Bay, 'created_at'|'updated_at'|'utilizationPct'>): Promise<Bay> {
  const r = await api.post('/bays', payload);
  return r.data;
}

export async function updateBay(id: string, patch: Partial<Bay>): Promise<Bay> {
  const r = await api.put(`/bays/${id}`, patch);
  return r.data;
}

export async function deleteBay(id: string): Promise<boolean> {
  await api.delete(`/bays/${id}`);
  return true;
}

export async function assignBay(id: string, params: { direction: 'IN'|'OUT'; ref: string; eta?: string; vehicle?: Bay['vehicle']; operation?: 'UNLOADING'|'LOADING' }): Promise<Bay> {
  const r = await api.post(`/bays/${id}/assign`, params);
  return r.data;
}

export async function vehicleArrived(id: string): Promise<Bay> {
  const r = await api.post(`/bays/${id}/arrived`);
  return r.data;
}

export async function releaseBay(id: string): Promise<Bay> {
  const r = await api.post(`/bays/${id}/release`);
  return r.data;
}

export async function switchDynamicType(id: string): Promise<Bay> {
  const r = await api.post(`/bays/${id}/toggle-dynamic`);
  return r.data;
}

export async function toggleMaintenance(id: string): Promise<Bay> {
  const r = await api.post(`/bays/${id}/toggle-maintenance`);
  return r.data;
}

export async function computeBayKpis(warehouseId?: string): Promise<BayKpis> {
  const r = await api.get('/bays/kpis', { params: warehouseId ? { warehouse_id: warehouseId } : undefined });
  return r.data;
}
