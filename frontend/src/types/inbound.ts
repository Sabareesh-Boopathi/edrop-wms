// Inbound domain types

export type VendorType = 'SKU' | 'FLAT';

export type ReceiptStatus =
  | 'AWAITING_UNLOADING'
  | 'UNLOADING'
  | 'MOVED_TO_BAY'
  | 'ALLOCATED'
  | 'READY_FOR_PICKING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ReceiptLine {
  id: string;
  receipt_id: string;
  product_sku?: string; // present for SKU vendors
  product_name?: string;
  customer_name?: string; // always for FLAT; also for resolved SKU orders
  apartment?: string;
  quantity: number;
  uom?: string;
  damaged?: number; // qty damaged
  missing?: number; // qty missing
  bin_id?: string; // when allocated
  notes?: string;
  exception?: boolean; // derived flag (damaged/missing)
  // QC fields
  received_qty?: number; // actual qty received after unloading
  damaged_origin?: 'UNLOADING' | 'WAREHOUSE'; // where damage occurred
  ack_diff?: boolean; // user acknowledged shorts/overs difference
}

export interface Receipt {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_type: VendorType;
  warehouse_id?: string; // to scope receipts by warehouse
  reference?: string; // PO / ASN / external Ref
  planned_arrival?: string; // ISO
  actual_arrival?: string; // ISO
  status: ReceiptStatus;
  lines: ReceiptLine[];
  created_at: string;
  updated_at: string;
  late?: boolean;
  exceptions_count?: number; // derived count of lines with exceptions
  overs_policy?: { hold_days: number; after: 'DISPOSE' | 'CHARITY' };
}

export interface ASN {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_type: VendorType;
  reference: string;
  eta: string; // ISO
  line_count: number;
  status: 'OPEN' | 'CONVERTED' | 'CANCELLED';
  created_at: string;
}

export interface GoodsInKpis {
  totalReceipts: number;
  openReceipts: number;
  completedToday: number;
  pending: number;
  lateArrivals: number;
  skuReceipts: number;
  flatReceipts: number;
  binsAllocated: number;
}

export type ReceiptFilter = {
  vendorType?: VendorType;
  status?: ReceiptStatus;
  search?: string; // id / sku / customer / bin
  dateFrom?: string;
  dateTo?: string;
  warehouseId?: string;
};
