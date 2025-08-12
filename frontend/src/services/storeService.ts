import api from './api';

export interface StoreDTO {
  id: string;
  store_name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  store_status: string;
  operation_start_time?: string | null;
  operation_end_time?: string | null;
  vendor_id: string;
}

export interface CreateStoreDTO {
  store_name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  store_status: string;
  operation_start_time?: string | null;
  operation_end_time?: string | null;
  vendor_id: string;
}

export interface StoreProductDTO {
  id: string;
  store_id: string;
  product_id: string;
  available_qty: number;
  price: number;
  bin_code?: string | null;
}

export interface CreateStoreProductDTO {
  store_id: string;
  product_id: string;
  available_qty: number;
  price: number;
  bin_code?: string | null;
}

export const listStores = async (): Promise<StoreDTO[]> => {
  const res = await api.get('/stores');
  return res.data;
};

export const listStoresByVendor = async (vendorId: string): Promise<StoreDTO[]> => {
  const res = await api.get(`/stores/by-vendor/${vendorId}`);
  return res.data;
};

export const listNearbyStores = async (lat: number, lon: number, radiusKm = 10, vendorId?: string): Promise<StoreDTO[]> => {
  const params: Record<string, any> = { lat, lon, radius_km: radiusKm };
  if (vendorId) params.vendor_id = vendorId;
  const res = await api.get('/stores/nearby', { params });
  return res.data;
};

export const createStore = async (payload: CreateStoreDTO): Promise<StoreDTO> => {
  const res = await api.post('/stores', payload);
  return res.data;
};

export const updateStore = async (storeId: string, payload: Partial<CreateStoreDTO>): Promise<StoreDTO> => {
  const res = await api.put(`/stores/${storeId}`, payload);
  return res.data;
};

export const deleteStore = async (storeId: string): Promise<void> => {
  await api.delete(`/stores/${storeId}`);
};

export const listStoreProducts = async (storeId: string): Promise<StoreProductDTO[]> => {
  const res = await api.get(`/stores/${storeId}/products`);
  return res.data;
};

export const addStoreProduct = async (storeId: string, payload: Omit<CreateStoreProductDTO, 'store_id'>): Promise<StoreProductDTO> => {
  const res = await api.post(`/stores/${storeId}/products`, { ...payload, store_id: storeId });
  return res.data;
};

export const updateStoreProduct = async (storeId: string, storeProductId: string, payload: Partial<CreateStoreProductDTO>): Promise<StoreProductDTO> => {
  const res = await api.put(`/stores/${storeId}/products/${storeProductId}` , payload);
  return res.data;
};

export const deleteStoreProduct = async (storeId: string, storeProductId: string): Promise<void> => {
  await api.delete(`/stores/${storeId}/products/${storeProductId}`);
};
