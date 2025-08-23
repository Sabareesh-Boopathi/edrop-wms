// Legacy RWA service - now proxies to Community service for backward compatibility
import * as communityService from './communityService';
import type { Community, CommunityCreate, CommunityUpdate } from './communityService';

// Legacy types for backward compatibility
export type RwaStatus = 'ACTIVE' | 'INACTIVE';
export interface Rwa extends Community {}
export type RwaCreate = CommunityCreate;
export type RwaUpdate = CommunityUpdate;

// Proxy functions to Community service
export const listRwas = communityService.listCommunities;
export const getRwa = communityService.getCommunity;
export const createRwa = communityService.createCommunity;
export const updateRwa = communityService.updateCommunity;
export const deleteRwa = communityService.deleteCommunity;
