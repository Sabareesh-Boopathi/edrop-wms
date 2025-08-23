import { useEffect, useState } from 'react';
import * as warehouseService from '../services/warehouseService';
import { useAuth } from '../contexts/AuthContext';

const LS_KEY = 'selectedWarehouseId';

export interface WarehouseOption { id: string; name: string }

export function useWarehouseSelection() {
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const mappedWarehouseId = (user?.warehouse_id ?? localStorage.getItem('AUTH_USER_WAREHOUSE_ID') ?? '') as string;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const ws = await warehouseService.getWarehouses();
        let opts: WarehouseOption[] = (ws || []).map((w: any) => ({ id: String(w.id), name: w.name || w.store_name || w.warehouse_name || String(w.id) }));
        if (!mounted) return;

        // If not admin, restrict to mapped warehouse only
        if (!isAdmin && mappedWarehouseId) {
          opts = opts.filter((o) => o.id === String(mappedWarehouseId));
        }
        setWarehouses(opts);

        // Decide initial warehouse selection
        if (!isAdmin && mappedWarehouseId) {
          setWarehouseId(String(mappedWarehouseId));
          // don't persist arbitrary selection for non-admins
          try { localStorage.setItem(LS_KEY, String(mappedWarehouseId)); } catch (e) { /* ignore storage errors */ }
        } else {
          const stored = localStorage.getItem(LS_KEY) || '';
          const initial = opts.find((o: WarehouseOption) => o.id === stored)?.id || opts[0]?.id || '';
          setWarehouseId(initial);
          if (initial && initial !== stored) localStorage.setItem(LS_KEY, initial);
        }
      } catch (e: any) {
        if (!mounted) return;
        setWarehouses([]);
        setError(e?.message || 'Failed to load warehouses');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [isAdmin, mappedWarehouseId]);

  const setWarehousePersist = (id: string) => {
    // Prevent changing selection for non-admins
    if (!isAdmin) {
      const enforced = String(mappedWarehouseId || id);
      setWarehouseId(enforced);
  try { localStorage.setItem(LS_KEY, enforced); } catch (e) { /* ignore storage errors */ }
      return;
    }
    setWarehouseId(id);
  try { localStorage.setItem(LS_KEY, id); } catch (e) { /* ignore storage errors */ }
  };

  return { warehouses, warehouseId, setWarehouseId: setWarehousePersist, loading, error, allowSelection: isAdmin };
}
