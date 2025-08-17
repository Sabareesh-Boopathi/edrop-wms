// Inbound service that calls backend APIs (no mocks)
import api from './api'
import { Receipt, ReceiptFilter, GoodsInKpis, ReceiptLine } from '../types/inbound'

// Public status flow used by UI timelines
export const receiptStatusFlow: Array<Receipt['status']> = [
  'AWAITING_UNLOADING',
  'UNLOADING',
  'MOVED_TO_BAY',
  'ALLOCATED',
  'READY_FOR_PICKING',
  'COMPLETED',
]

export async function listReceipts(filter?: ReceiptFilter): Promise<Receipt[]> {
  const params: any = {}
  if (filter?.warehouseId) params.warehouse_id = filter.warehouseId
  if (filter?.vendorType) params.vendor_type = filter.vendorType
  if (filter?.status) params.status = filter.status
  if (filter?.search) params.search = filter.search
  if (filter?.dateFrom) params.date_from = filter.dateFrom
  if (filter?.dateTo) params.date_to = filter.dateTo
  const res = await api.get('/inbound/receipts', { params })
  return res.data
}

export async function getReceipt(id: string): Promise<Receipt> {
  const res = await api.get(`/inbound/receipts/${id}`)
  return res.data
}

export async function createReceipt(payload: Partial<Receipt>): Promise<Receipt> {
  const res = await api.post('/inbound/receipts', payload)
  return res.data
}

export async function updateReceiptStatus(id: string, status: Receipt['status']): Promise<Receipt> {
  const res = await api.put(`/inbound/receipts/${id}`, { status })
  return res.data
}

export async function progressReceipt(id: string): Promise<Receipt> {
  // naive: get, compute next, update
  const rec = await getReceipt(id)
  const order = ['AWAITING_UNLOADING','UNLOADING','MOVED_TO_BAY','ALLOCATED','READY_FOR_PICKING','COMPLETED']
  const idx = order.indexOf(rec.status)
  const next = idx >= 0 && idx < order.length - 1 ? order[idx+1] : rec.status
  return updateReceiptStatus(id, next as any)
}

export async function flagLineIssues(lineId: string, damaged?: number, missing?: number, notes?: string): Promise<ReceiptLine> {
  const res = await api.patch(`/inbound/lines/${lineId}`, { damaged, missing, notes })
  return res.data
}

export async function setReceivedQty(lineId: string, qty: number): Promise<ReceiptLine> {
  const res = await api.patch(`/inbound/lines/${lineId}`, { received_qty: qty })
  return res.data
}

export async function acknowledgeDiff(lineId: string, ack: boolean): Promise<ReceiptLine> {
  const res = await api.patch(`/inbound/lines/${lineId}`, { ack_diff: ack })
  return res.data
}

export async function setDamageOrigin(lineId: string, origin: 'UNLOADING'|'WAREHOUSE'): Promise<ReceiptLine> {
  const res = await api.patch(`/inbound/lines/${lineId}`, { damaged_origin: origin })
  return res.data
}

export async function setLineBin(lineId: string, binId: string): Promise<ReceiptLine> {
  const res = await api.patch(`/inbound/lines/${lineId}`, { bin_id: binId })
  return res.data
}

export async function autoAllocateReceiptBins(receiptId: string): Promise<Receipt> {
  const res = await api.post(`/inbound/receipts/${receiptId}/auto-allocate`)
  return res.data
}

export async function reassignLineBin(lineId: string): Promise<ReceiptLine> {
  const res = await api.post(`/inbound/lines/${lineId}/reassign`)
  return res.data
}

export async function clearLineBin(lineId: string): Promise<ReceiptLine> {
  const res = await api.post(`/inbound/lines/${lineId}/clear`)
  return res.data
}

export async function computeKpis(): Promise<GoodsInKpis> {
  const res = await api.get('/inbound/kpis')
  const data = res.data || {}
  return {
    totalReceipts: data.totalReceipts ?? 0,
    openReceipts: data.openReceipts ?? 0,
    completedToday: data.completedToday ?? 0,
    pending: data.pending ?? 0,
    lateArrivals: data.lateArrivals ?? 0,
    skuReceipts: data.skuReceipts ?? 0,
    flatReceipts: data.flatReceipts ?? 0,
    binsAllocated: data.binsAllocated ?? 0,
  }
}
