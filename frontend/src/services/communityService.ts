import api from './api';

export type CommunityStatus = 'ACTIVE' | 'INACTIVE';
export type CommunityType = 'COMMUNITY' | 'INDIVIDUAL';

export interface Community {
  id: string;
  name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  
  // New required fields for RWA/Community management
  rwa_name?: string | null;               // RWA name (for communities)
  rwa_email?: string | null;              // RWA email
  fm_email?: string | null;               // Facility Manager email
  fm_number?: string | null;              // Facility Manager number
  blocks?: string[] | null;               // Block/Tower information as list
  
  // Additional fields from RWA
  code?: string | null;                   // Community/RWA code
  community_type: CommunityType;          // Type of community
  status: CommunityStatus;                // Status
  warehouse_id?: string | null;           // Associated warehouse
  notes?: string | null;                  // Additional notes
  
  created_at?: string;
  updated_at?: string;
}

export type CommunityCreate = Omit<Community, 'id' | 'created_at' | 'updated_at'>;
export type CommunityUpdate = Partial<CommunityCreate>;

// Clean API implementation
const API = '/communities/';

export async function listCommunities(filter?: { 
  warehouse_id?: string; 
  community_type?: CommunityType;
  status?: CommunityStatus;
}): Promise<Community[]> {
  const params = new URLSearchParams();
  if (filter?.warehouse_id) params.append('warehouse_id', filter.warehouse_id);
  if (filter?.community_type) params.append('community_type', filter.community_type);
  if (filter?.status) params.append('status', filter.status);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const r = await api.get(`${API}${qs}`);
  return r.data;
}

export async function getCommunity(id: string): Promise<Community> { 
  const r = await api.get(`${API}${id}`); 
  return r.data; 
}

export async function createCommunity(payload: CommunityCreate): Promise<Community> { 
  const r = await api.post(API, payload); 
  return r.data; 
}

export async function updateCommunity(id: string, payload: CommunityUpdate): Promise<Community> { 
  const r = await api.put(`${API}${id}`, payload); 
  return r.data; 
}

export async function deleteCommunity(id: string): Promise<void> { 
  await api.delete(`${API}${id}`); 
}
