import { useCallback, useEffect, useState } from 'react';
import { Bay, BayKpis } from '../types/bay';
import { listBays, listBaysByWarehouse, computeBayKpis } from '../services/bayService';

export function useBays(warehouseId?: string) {
  const [bays, setBays] = useState<Bay[]>([]);
  const [kpis, setKpis] = useState<BayKpis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [b, k] = await Promise.all([
        warehouseId ? listBaysByWarehouse(warehouseId) : listBays(),
        computeBayKpis(warehouseId)
      ]);
      setBays(b); setKpis(k);
    } catch (e: any) {
      setError(e.message || 'Failed to load bays');
    } finally { setLoading(false); }
  }, [warehouseId]);

  useEffect(() => { load(); }, [load]);

  return { bays, kpis, loading, error, reload: load };
}
