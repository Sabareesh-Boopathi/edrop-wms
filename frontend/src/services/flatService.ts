// Legacy Flat service - now proxies to Community service for backward compatibility
import * as communityService from './communityService';
import type { Community, CommunityUpdate } from './communityService';

// Legacy types for backward compatibility
export interface Flat {
  id: string;
  rwa_id: string; // Maps to community_id
  flat_number: string;
  tower?: string | null;
  building_name?: string | null;
  address_line?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: 'ACTIVE' | 'INACTIVE';
}

export type FlatCreate = Omit<Flat, 'id'>;
export type FlatUpdate = Partial<FlatCreate>;

// Since flats are now part of communities, we'll return communities as flats for compatibility
export async function listFlats(filter?: { warehouse_id?: string; rwa_id?: string }): Promise<Flat[]> {
  const communities = await communityService.listCommunities(filter);
  // Convert communities to "flats" for backward compatibility
  return communities.map(community => ({
    id: community.id,
    rwa_id: community.id, // Self-reference since communities replace both RWA and flats
    flat_number: community.name, // Use community name as "flat number"
    building_name: community.name,
    address_line: community.address_line1,
    latitude: community.latitude,
    longitude: community.longitude,
    status: community.status,
  }));
}

export async function getFlat(id: string): Promise<Flat> {
  const community = await communityService.getCommunity(id);
  return {
    id: community.id,
    rwa_id: community.id,
    flat_number: community.name,
    building_name: community.name,
    address_line: community.address_line1,
    latitude: community.latitude,
    longitude: community.longitude,
    status: community.status,
  };
}

// These operations will work on communities
export const createFlat = (payload: FlatCreate) => {
  // Convert flat data to community data
  const communityData = {
    name: payload.flat_number || 'Unnamed',
    address_line1: payload.address_line || '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    community_type: 'INDIVIDUAL' as const,
    status: payload.status || 'ACTIVE' as const,
  };
  return communityService.createCommunity(communityData);
};

export const updateFlat = (id: string, payload: FlatUpdate) => {
  const communityData: CommunityUpdate = {};
  if (payload.flat_number) communityData.name = payload.flat_number;
  if (payload.address_line) communityData.address_line1 = payload.address_line;
  if (payload.status) communityData.status = payload.status;
  return communityService.updateCommunity(id, communityData);
};

export const deleteFlat = communityService.deleteCommunity;

// Legacy alias for backward compatibility
export const getFlats = listFlats;
