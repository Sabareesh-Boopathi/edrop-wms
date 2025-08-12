// frontend/src/services/rackService.ts
import api from './api';
import { Rack, Bin } from '../types';

// Racks
export const getRacksByWarehouse = async (warehouseId: string): Promise<Rack[]> => {
  const res = await api.get(`/warehouses/${warehouseId}/racks`);
  return res.data;
};

export const createRack = async (payload: {
  warehouse_id: string;
  stacks: number;
  bins_per_stack: number;
  description?: string;
  status?: Rack['status'];
}): Promise<Rack> => {
  const res = await api.post('/racks', payload);
  return res.data;
};

export const updateRack = async (
  rackId: string,
  payload: Partial<Pick<Rack, 'stacks' | 'bins_per_stack' | 'description' | 'warehouse_id' | 'status'>>
): Promise<Rack> => {
  const res = await api.put(`/racks/${rackId}`, payload);
  return res.data;
};

export const deleteRack = async (rackId: string): Promise<void> => {
  await api.delete(`/racks/${rackId}`);
};

// Bins
export const getBinsByRack = async (rackId: string): Promise<Bin[]> => {
  const res = await api.get(`/racks/${rackId}/bins`);
  return res.data;
};

export const createBin = async (rackId: string, payload: {
  stack_index: number;
  bin_index: number;
  status?: Bin['status'];
  crate_id?: string;
  product_id?: string;
  store_product_id?: string;
  quantity?: number;
}): Promise<Bin> => {
  const res = await api.post(`/racks/${rackId}/bins`, payload);
  return res.data;
};

export const updateBin = async (binId: string, payload: Partial<Bin>): Promise<Bin> => {
  const res = await api.put(`/bins/${binId}`, payload);
  return res.data;
};

export const deleteBin = async (binId: string): Promise<void> => {
  await api.delete(`/bins/${binId}`);
};
