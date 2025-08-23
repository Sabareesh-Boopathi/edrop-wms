import api from './api';

export interface Address {
  id: string;
  street_address: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
  door_number?: string;
  delivery_instructions?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type AddressCreate = Omit<Address, 'id' | 'created_at' | 'updated_at'>;
export type AddressUpdate = Partial<Omit<Address, 'id' | 'created_at' | 'updated_at'>>;

const API = '/addresses/';

export async function listAddresses(filter?: { 
  city?: string; 
  state?: string; 
  pincode?: string; 
}): Promise<Address[]> {
  const params = new URLSearchParams();
  if (filter?.city) params.append('city', filter.city);
  if (filter?.state) params.append('state', filter.state);
  if (filter?.pincode) params.append('pincode', filter.pincode);
  
  const qs = params.toString() ? `?${params.toString()}` : '';
  const r = await api.get(`${API}${qs}`);
  return r.data;
}

export async function getAddress(id: string): Promise<Address> { 
  const r = await api.get(`${API}${id}`); 
  return r.data; 
}

export async function createAddress(payload: AddressCreate): Promise<Address> {
  // Validate required fields
  if (!payload.street_address?.trim()) {
    throw new Error('Street address is required');
  }
  if (!payload.city?.trim()) {
    throw new Error('City is required');
  }
  if (!payload.state?.trim()) {
    throw new Error('State is required');
  }
  if (!payload.pincode?.trim()) {
    throw new Error('Pincode is required');
  }
  
  const body: AddressCreate = { 
    street_address: payload.street_address.trim(),
    area: payload.area?.trim() || undefined,
    city: payload.city.trim(),
    state: payload.state.trim(),
    pincode: payload.pincode.trim(),
    country: payload.country || 'India',
    landmark: payload.landmark?.trim() || undefined,
    door_number: payload.door_number?.trim() || undefined,
    delivery_instructions: payload.delivery_instructions?.trim() || undefined,
    latitude: payload.latitude,
    longitude: payload.longitude,
    notes: payload.notes?.trim() || undefined,
  };
  
  console.log('Creating address with payload:', body);
  const r = await api.post(API, body);
  return r.data;
}

export async function updateAddress(id: string, payload: AddressUpdate): Promise<Address> { 
  const body: AddressUpdate = { 
    street_address: payload.street_address?.trim(),
    area: payload.area?.trim() || undefined,
    city: payload.city?.trim(),
    state: payload.state?.trim(),
    pincode: payload.pincode?.trim(),
    country: payload.country,
    landmark: payload.landmark?.trim() || undefined,
    door_number: payload.door_number?.trim() || undefined,
    delivery_instructions: payload.delivery_instructions?.trim() || undefined,
    latitude: payload.latitude,
    longitude: payload.longitude,
    notes: payload.notes?.trim() || undefined,
  };
  
  console.log('Updating address with payload:', body);
  const r = await api.put(`${API}${id}`, body); 
  return r.data; 
}

export async function deleteAddress(id: string): Promise<void> { 
  await api.delete(`${API}${id}`); 
}

// Legacy alias for backward compatibility
export const getAddresses = listAddresses;
