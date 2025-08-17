import { useCallback, useEffect, useMemo, useState } from 'react';
import { Receipt, ReceiptFilter, GoodsInKpis } from '../types/inbound';
import { listReceipts, computeKpis } from '../services/inboundService';

export function useInboundData(initialFilter?: ReceiptFilter) {
  const [filter, setFilter] = useState<ReceiptFilter>(initialFilter || {});
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [kpis, setKpis] = useState<GoodsInKpis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [r, k] = await Promise.all([
        listReceipts(filter),
        computeKpis(),
      ]);
      setReceipts(r); setKpis(k);
    } catch (e: any) {
      setError(e.message || 'Failed to load inbound data');
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setPartialFilter = useCallback((p: Partial<ReceiptFilter>) => {
    setFilter(f => ({ ...f, ...p }));
  }, []);

  const groupedByStatus = useMemo(() => {
    return receipts.reduce<Record<string, Receipt[]>>((acc, r) => { (acc[r.status] ||= []).push(r); return acc; }, {});
  }, [receipts]);

  return { filter, setFilter: setPartialFilter, receipts, kpis, groupedByStatus, loading, error, reload: load };
}
