import { useEffect, useState } from 'react';
import * as warehouseService from '../services/warehouseService';

const LS_KEY = 'selectedWarehouseId';

export interface WarehouseOption { id: string; name: string }

export function useWarehouseSelection() {
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError(null);
      try {
  const ws = await warehouseService.getWarehouses();
  const opts: WarehouseOption[] = (ws || []).map((w: any) => ({ id: String(w.id), name: w.name || w.store_name || w.warehouse_name || String(w.id) }));
        if (!mounted) return;
        setWarehouses(opts);
        const stored = localStorage.getItem(LS_KEY) || '';
  const initial = opts.find((o: WarehouseOption) => o.id === stored)?.id || opts[0]?.id || '';
        setWarehouseId(initial);
        if (initial && initial !== stored) localStorage.setItem(LS_KEY, initial);
      } catch (e: any) {
        if (!mounted) return;
        setWarehouses([]);
        setError(e?.message || 'Failed to load warehouses');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const setWarehousePersist = (id: string) => {
    setWarehouseId(id);
    try { localStorage.setItem(LS_KEY, id); } catch (e) { /* ignore storage errors */ }
  };

  return { warehouses, warehouseId, setWarehouseId: setWarehousePersist, loading, error };
}
