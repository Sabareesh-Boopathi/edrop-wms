import api from './api';
import { VendorSchema, VendorData } from '../pages/administration/Vendors';

const API_URL = '/vendors';

export const getVendors = async (): Promise<VendorData[]> => {
    const response = await api.get(API_URL);
    return response.data;
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
