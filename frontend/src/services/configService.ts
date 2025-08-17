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
  // Inbound policies
  inboundOversPolicy?: { hold_days: number; after: 'DISPOSE' | 'CHARITY' };
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
  // Inbound Receipts
  nextReceiptSeq?: number;
  receiptPrefix?: string;
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
  // Inbound policies (warehouse-level override)
  inboundOversPolicy?: { hold_days: number; after: 'DISPOSE' | 'CHARITY' };
}

export const getSystemConfig = async (): Promise<SystemConfig> => {
  try {
    const res = await api.get('/system/config');
    return res.data;
  } catch {
    // Fallback mock for dev
    return { appName: 'eDrop WMS', defaultTimeZone: 'Asia/Kolkata', dateFormat: 'dd/MM/yyyy', defaultLanguage: 'en', inboundOversPolicy: { hold_days: 3, after: 'DISPOSE' } };
  }
};

export const saveSystemConfig = async (payload: SystemConfig): Promise<SystemConfig> => {
  const res = await api.put('/system/config', payload);
  return res.data;
};

export const getWarehouseConfig = async (warehouseId: string): Promise<WarehouseConfig> => {
  try {
    const res = await api.get(`/warehouses/${warehouseId}/config`);
    return res.data;
  } catch {
    // Fallback mock for dev
  return { warehouseName: 'Default WH', shortCode: 'DFT', nextCrateSeq: 1, nextRackSeq: 1, nextBinSeq: 1, nextReceiptSeq: 1, inboundOversPolicy: { hold_days: 3, after: 'DISPOSE' } } as WarehouseConfig;
  }
};

export const saveWarehouseConfig = async (
  warehouseId: string,
  payload: WarehouseConfig
): Promise<WarehouseConfig> => {
  const res = await api.put(`/warehouses/${warehouseId}/config`, payload);
  return res.data;
};
