import api from './api';

export type DriverStatus = 'ACTIVE' | 'INACTIVE';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  license_no: string;
  license_expiry?: string | null;
  status: DriverStatus;
  carrier?: string | null;
  assigned_vehicle_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type DriverCreate = Omit<Driver, 'id' | 'created_at' | 'updated_at'>;
export type DriverUpdate = Partial<DriverCreate>;

const API = '/drivers';

export async function listDrivers(filter?: { warehouse_id?: string }): Promise<Driver[]> {
  const qs = filter?.warehouse_id ? `?warehouse_id=${encodeURIComponent(filter.warehouse_id)}` : '';
  const r = await api.get(`${API}${qs}`);
  return r.data;
}
export async function getDriver(id: string): Promise<Driver> { const r = await api.get(`${API}/${id}`); return r.data; }
export async function createDriver(payload: DriverCreate): Promise<Driver> { const r = await api.post(API, payload); return r.data; }
export async function updateDriver(id: string, payload: DriverUpdate): Promise<Driver> { const r = await api.put(`${API}/${id}`, payload); return r.data; }
export async function deleteDriver(id: string): Promise<void> { await api.delete(`${API}/${id}`); }
