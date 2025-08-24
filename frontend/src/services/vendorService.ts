import api from './api';
import { VendorSchema, VendorData } from '../pages/administration/Vendors';

const API_URL = '/vendors';

export const getVendors = async (): Promise<VendorData[]> => {
    const response = await api.get(API_URL);
    return response.data;
};

export const getVendorSummaries = async (): Promise<Array<{ id: string; business_name: string; email?: string | null; phone_number?: string | null; vendor_type: string; vendor_status: string; store_count: number; product_count: number }>> => {
  const res = await api.get(`${API_URL}/summary`);
  return res.data;
};

export const getVendorById = async (id: string): Promise<VendorData> => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
};

export const createVendor = async (vendor: VendorSchema): Promise<VendorData> => {
    const response = await api.post(API_URL, vendor);
    return response.data;
};

export const updateVendor = async (id: string, vendor: Partial<VendorSchema>): Promise<VendorData> => {
    const response = await api.put(`${API_URL}/${id}`, vendor);
    return response.data;
};

export const deleteVendor = async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
};

export const unmaskVendor = async (id: string, reason: string): Promise<{ phone_number?: string; email?: string; name?: string; }> => {
  const res = await api.post(`${API_URL}/${id}:unmask`, { reason });
  return res.data;
};

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

export const getVendorStores = async (vendorId: string): Promise<StoreDTO[]> => {
  const res = await api.get(`${API_URL}/${vendorId}/stores`);
  return res.data;
};
