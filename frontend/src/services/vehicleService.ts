import api from './api';

export type VehicleStatus = 'AVAILABLE' | 'IN_SERVICE' | 'MAINTENANCE';
export type VehicleType = 'VAN_S' | 'TRUCK_M' | 'TRUCK_L';

export interface Vehicle {
  id: string;
  reg_no: string;
  type: VehicleType;
  capacity_totes?: number | null;
  capacity_volume?: number | null;
  status: VehicleStatus;
  carrier?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type VehicleCreate = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
export type VehicleUpdate = Partial<VehicleCreate>;

const API = '/vehicles';

export async function listVehicles(filter?: { warehouse_id?: string }): Promise<Vehicle[]> {
  const qs = filter?.warehouse_id ? `?warehouse_id=${encodeURIComponent(filter.warehouse_id)}` : '';
  const r = await api.get(`${API}${qs}`);
  return r.data;
}
export async function getVehicle(id: string): Promise<Vehicle> { const r = await api.get(`${API}/${id}`); return r.data; }
export async function createVehicle(payload: VehicleCreate): Promise<Vehicle> { const r = await api.post(API, payload); return r.data; }
export async function updateVehicle(id: string, payload: VehicleUpdate): Promise<Vehicle> { const r = await api.put(`${API}/${id}`, payload); return r.data; }
export async function deleteVehicle(id: string): Promise<void> { await api.delete(`${API}/${id}`); }
