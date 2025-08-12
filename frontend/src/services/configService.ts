import api from './api';

export interface SystemConfig {
  appName: string;
  logoUrl?: string;
  defaultTimeZone: string;
  dateFormat: string;
  timeFormat?: string;
  defaultLanguage: string;
  // Crate
  defaultCrateSize?: string;
  defaultCrateStatus?: string;
  // Rack & Bin
  maxStackHeight?: number;
  maxBinsPerRack?: number;
  defaultRackStatus?: string; // new: default status for newly created racks
  // Security
  sessionTimeoutMins?: number;
  passwordPolicy?: string;
  roleAccessToggle?: boolean;
  // Connectivity
  defaultPrinter?: string;
  defaultScanner?: string;
  // Integration & API
  apiBaseUrl?: string;
  apiToken?: string;
  // System behavior
  autoGenerateMissingIds?: boolean;
  dataSyncIntervalMins?: number;
}

export interface WarehouseConfig {
  warehouseName: string;
  shortCode: string; // 3 digits/letters
  // Crates
  nextCrateSeq: number;
  cratePrefix?: string;
  crateSuffix?: string;
  // Racks & Bins
  nextRackSeq: number;
  rackPrefix?: string;
  nextBinSeq: number;
  // Service Area
  serviceAreaRangeKm?: number;
  dockBayCount?: number;
  // Capacity
  maxCratesCapacity?: number;
  maxPalletsCapacity?: number;
  // Printing & Scanning
  printer?: string;
  scanner?: string;
  // Rules
  defaultCrateExpiryDays?: number;
  autoCloseEmptyBins?: boolean;
  utilizationAlertThreshold?: number; // percent
  // Custom Labels
  rackLabelTemplate?: string;
  crateLabelTemplate?: string;
}

export const getSystemConfig = async (): Promise<SystemConfig> => {
  const res = await api.get('/system/config');
  return res.data;
};

export const saveSystemConfig = async (payload: SystemConfig): Promise<SystemConfig> => {
  const res = await api.put('/system/config', payload);
  return res.data;
};

export const getWarehouseConfig = async (warehouseId: string): Promise<WarehouseConfig> => {
  const res = await api.get(`/warehouses/${warehouseId}/config`);
  return res.data;
};

export const saveWarehouseConfig = async (
  warehouseId: string,
  payload: WarehouseConfig
): Promise<WarehouseConfig> => {
  const res = await api.put(`/warehouses/${warehouseId}/config`, payload);
  return res.data;
};
