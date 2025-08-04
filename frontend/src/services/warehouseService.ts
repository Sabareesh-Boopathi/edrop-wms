// frontend/src/services/warehouseService.ts
import api from './api';
import { Warehouse, WarehouseSchema } from '../pages/administration/WarehouseManagement'; // Adjust the import path as needed

export const getWarehouses = async (): Promise<Warehouse[]> => {
  const response = await api.get('/warehouses/');
  return response.data;
};

export const createWarehouse = async (warehouseData: WarehouseSchema): Promise<Warehouse> => {
  const response = await api.post('/warehouses/', warehouseData);
  return response.data;
};

export const updateWarehouse = async (id: string, warehouseData: Partial<Warehouse>): Promise<Warehouse> => {
  const response = await api.put(`/warehouses/${id}`, warehouseData);
  return response.data;
};

export const deleteWarehouse = async (id: string): Promise<void> => {
  await api.delete(`/warehouses/${id}`);
};
