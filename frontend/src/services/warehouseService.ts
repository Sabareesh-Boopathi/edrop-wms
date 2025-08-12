// frontend/src/services/warehouseService.ts
import api from './api';

export const getWarehouses = async (): Promise<any> => {
  const response = await api.get('/warehouses/');
  return response.data;
};

export const createWarehouse = async (warehouseData: any): Promise<any> => {
  const response = await api.post('/warehouses/', warehouseData);
  return response.data;
};

export const updateWarehouse = async (id: string, warehouseData: any): Promise<any> => {
  const response = await api.put(`/warehouses/${id}`, warehouseData);
  return response.data;
};

export const deleteWarehouse = async (id: string): Promise<void> => {
  await api.delete(`/warehouses/${id}`);
};
