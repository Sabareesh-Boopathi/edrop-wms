import api from './api';

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Customer {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  // Location - Either community OR address (not both)
  community_id?: string;
  block?: string;
  flat_number?: string;
  address_id?: string;
  status: CustomerStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed properties
  location_type?: string; // 'COMMUNITY' or 'INDIVIDUAL'
  full_address?: string;  // Computed full address
}

export type CustomerCreate = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type CustomerUpdate = Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>;

// Clean API implementation - no duplicates
const API = '/customers/';

export async function listCustomers(filter?: { warehouse_id?: string }): Promise<Customer[]> {
  const qs = filter?.warehouse_id ? `?warehouse_id=${encodeURIComponent(filter.warehouse_id)}` : '';
  const r = await api.get(`${API}${qs}`);
  return r.data;
}

export async function getCustomer(id: string): Promise<Customer> { 
  const r = await api.get(`${API}${id}`); 
  return r.data; 
}

export async function createCustomer(payload: CustomerCreate): Promise<Customer> {
  // Validate required fields
  if (!payload.name?.trim()) {
    throw new Error('Name is required');
  }
  if (!payload.phone_number?.trim()) {
    throw new Error('Phone number is required');
  }
  if (!payload.email?.trim()) {
    throw new Error('Email is required');
  }
  
  // Validate that customer has either community_id OR address_id, but not both
  if (payload.community_id && payload.address_id) {
    throw new Error('Customer cannot have both community and address. Please choose one.');
  }
  if (!payload.community_id && !payload.address_id) {
    throw new Error('Customer must have either a community or an address');
  }
  
  const body: CustomerCreate = { 
    name: payload.name.trim(),
    phone_number: payload.phone_number.trim(),
    email: payload.email.trim(),
    community_id: payload.community_id || undefined,
    address_id: payload.address_id || undefined,
    block: payload.block?.trim() || undefined,
    flat_number: payload.flat_number?.trim() || undefined,
    status: payload.status || 'ACTIVE',
    notes: payload.notes?.trim() || undefined
  };
  
  console.log('Creating customer with payload:', body);
  const r = await api.post(API, body);
  return r.data;
}

export async function updateCustomer(id: string, payload: CustomerUpdate): Promise<Customer> { 
  const body: CustomerUpdate = { 
    name: payload.name?.trim(),
    phone_number: payload.phone_number?.trim(),
    email: payload.email?.trim(),
    community_id: payload.community_id,
    address_id: payload.address_id,
    block: payload.block?.trim() || undefined,
    flat_number: payload.flat_number?.trim() || undefined,
    status: payload.status,
    notes: payload.notes?.trim() || undefined
  };
  
  console.log('Updating customer with payload:', body);
  const r = await api.put(`${API}${id}`, body); 
  return r.data; 
}

export async function deleteCustomer(id: string): Promise<void> { 
  await api.delete(`${API}${id}`); 
}

// Legacy alias for backward compatibility - will be removed in future versions
export const getCustomers = listCustomers;
