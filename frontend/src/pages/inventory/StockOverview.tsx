import React, { useEffect, useMemo, useState } from 'react';
import '../../theme/utilities.css';
import '../inbound/Inbound.css';
import { getWarehouses } from '../../services/warehouseService';
import api from '../../services/api';
import notify from '../../lib/notify';
import KpiCard from '../../components/KpiCard';
import { Layers, Package, DollarSign, Search, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/table';
import TableCard from '../../components/table/TableCard';

type WarehouseDTO = { id: string; name: string };
type InventoryRow = {
  id: string;
  store_id: string;
  product_id: string;
  available_qty: number;
  price: number;
  bin_code?: string | null;
  product_name: string;
  store_name: string;
};

// Mock inventory data (visual only)
const MOCK_INVENTORY: InventoryRow[] = [
  { id: 'sp-1001', store_id: 'store-001', product_id: 'prod-001', available_qty: 120, price: 199.0, bin_code: 'A1-01', product_name: 'Eco Bottle 1L', store_name: 'Store Alpha' },
  { id: 'sp-1002', store_id: 'store-002', product_id: 'prod-002', available_qty: 45, price: 349.5, bin_code: 'B2-14', product_name: 'Stainless Lunchbox', store_name: 'Store Beta' },
  { id: 'sp-1003', store_id: 'store-001', product_id: 'prod-003', available_qty: 0, price: 79.99, bin_code: 'C3-07', product_name: 'Canvas Tote Bag', store_name: 'Store Alpha' },
  { id: 'sp-1004', store_id: 'store-003', product_id: 'prod-004', available_qty: 260, price: 29.0, bin_code: 'D4-22', product_name: 'Bamboo Straw Pack', store_name: 'Store Gamma' },
  { id: 'sp-1005', store_id: 'store-002', product_id: 'prod-005', available_qty: 8, price: 999.0, bin_code: null, product_name: 'Solar Power Bank', store_name: 'Store Beta' },
];

const StockOverview: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<'product_name' | 'store_name' | 'available_qty' | 'price' | 'bin_code'>('product_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  // Mock filters (visual only)
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [storeFilter, setStoreFilter] = useState('All Stores');
  const [productFilter, setProductFilter] = useState('All Products');
  const vendorOptions = ['All Vendors', 'Vendor A', 'Vendor B', 'Vendor C'];
  const storeOptions = ['All Stores', 'Store Alpha', 'Store Beta', 'Store Gamma'];
  const productOptions = ['All Products', 'Product One', 'Product Two', 'Product Three'];

  useEffect(() => {
    (async () => {
      const ws = await getWarehouses();
      setWarehouses(ws);
      if (ws.length && !warehouseId) setWarehouseId(ws[0].id);
    })();
  }, []);

  const fetchData = () => {
    if (!warehouseId) return;
    setLoading(true);
    const params = new URLSearchParams({
      skip: String((page - 1) * pageSize),
      limit: String(pageSize),
      sort_by: sortKey,
      sort_dir: sortDir,
    });
    const qv = query.trim();
    if (qv) params.set('q', qv);
    api
      .get(`/warehouses/${warehouseId}/products?${params.toString()}`)
      .then((res) => {
        const data = res?.data;
        const items = Array.isArray(data) ? data : (data?.items ?? []);
        const totalCount = typeof data?.total === 'number' ? data.total : items.length;
        setRows(items.length ? items : MOCK_INVENTORY);
        setTotal(items.length ? totalCount : MOCK_INVENTORY.length);
      })
      .catch(() => notify.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [warehouseId, page, pageSize, sortKey, sortDir]);

  // Refetch on query change with debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const totals = useMemo(() => {
    const totalSkus = new Set(rows.map((r) => r.product_id)).size;
    const totalQty = rows.reduce((acc, r) => acc + (Number(r.available_qty) || 0), 0);
    const totalValue = rows.reduce((acc, r) => acc + (Number(r.available_qty) * Number(r.price)), 0);
    return { totalSkus, totalQty, totalValue };
  }, [rows]);

  const filtered = rows; // server-side filtering/sorting/pagination
  // Client-side sort fallback to ensure visible sort even if backend ignores sort params
  const displayRows = useMemo(() => {
    const arr = [...filtered];
    const cmp = (a: any, b: any) => {
      const va = a[sortKey as keyof InventoryRow] as any;
      const vb = b[sortKey as keyof InventoryRow] as any;
      const toKey = (v: any) => (typeof v === 'number' ? v : v == null ? '' : String(v).toLowerCase());
      const ka = toKey(va);
      const kb = toKey(vb);
      if (ka < kb) return sortDir === 'asc' ? -1 : 1;
      if (ka > kb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    };
    arr.sort(cmp);
    return arr;
  }, [filtered, sortKey, sortDir]);

  const applyFilters = () => {
    setPage(1);
    fetchData();
  };
  const resetFilters = () => {
    setVendorFilter('All Vendors');
    setStoreFilter('All Stores');
    setProductFilter('All Products');
    setQuery('');
    setPage(1);
    fetchData();
  };

  return (
    <div className="page-container" style={{ padding: 'var(--space-5)' }}>
      <div className="inbound-header">
        <div>
          <h1>Stock Overview</h1>
          <p>View current stock across stores, bins, and value.</p>
        </div>
        <div className="inline-actions">
          <button
            className="icon-btn"
            title={loading ? 'Refreshing…' : 'Refresh'}
            aria-label="Refresh"
            onClick={fetchData}
            disabled={loading}
          >
            <RotateCw size={18} />
          </button>
        </div>
      </div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <KpiCard icon={<Layers className="icon" />} title="Total SKUs" value={totals.totalSkus} variant="slate" />
        <KpiCard icon={<Package className="icon" />} title="Total Qty" value={totals.totalQty} variant="indigo" />
        <KpiCard icon={<DollarSign className="icon" />} title="Stock Value" value={`₹ ${totals.totalValue.toFixed(2)}`} variant="emerald" />
      </div>

      <TableCard
        variant="inbound"
        title="Inventory"
        warehouse={(
          <div className="form-field" style={{ maxWidth: 260 }}>
            <label>Warehouse</label>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}
    search={(
          <div className="form-field" style={{ maxWidth: 340 }}>
            <label>Search</label>
            <div style={{ position: 'relative' }}>
      <Search size={16} style={{ position: 'absolute', left: 8, top: '50%', transform:'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
      <input style={{ paddingLeft: 30 }} placeholder="Product / Store / Bin" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e)=> { if (e.key==='Enter') { setPage(1); fetchData(); } }} />
            </div>
          </div>
        )}
    // actions removed (auto-apply)
        filters={(
          <>
            <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} style={{ height: 'var(--control-height-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', background: 'var(--color-surface)', padding: 'var(--control-padding-y) var(--control-padding-x)', fontSize: 'var(--font-size-sm)' }}>
              {vendorOptions.map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
            <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} style={{ height: 'var(--control-height-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', background: 'var(--color-surface)', padding: 'var(--control-padding-y) var(--control-padding-x)', fontSize: 'var(--font-size-sm)' }}>
              {storeOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} style={{ height: 'var(--control-height-md)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', background: 'var(--color-surface)', padding: 'var(--control-padding-y) var(--control-padding-x)', fontSize: 'var(--font-size-sm)' }}>
              {productOptions.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </>
        )}
        footer={(
          <>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              {total ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}` : '—'}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                className="btn-outline-token"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
                title="Previous"
                style={{
                  width: 'var(--control-height-sm)',
                  height: 'var(--control-height-sm)',
                  padding: 0,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ minWidth: 32, textAlign: 'center' }}>{page}</span>
              <button
                type="button"
                className="btn-outline-token"
                onClick={() => setPage((p) => (p * pageSize < total ? p + 1 : p))}
                disabled={page * pageSize >= total}
                aria-label="Next page"
                title="Next"
                style={{
                  width: 'var(--control-height-sm)',
                  height: 'var(--control-height-sm)',
                  padding: 0,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <ChevronRight size={16} />
              </button>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: 'var(--control-height-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', background: 'var(--color-surface)', padding: 'var(--control-padding-y-sm) var(--control-padding-x-sm)', fontSize: 'var(--font-size-sm)' }}
              >
                {[10, 25, 50, 100].map((s) => <option key={s} value={s}>{s}/page</option>)}
              </select>
            </div>
          </>
        )}
      >
        <Table>
            <TableHeader>
              <TableRow>
                {[
                  { k: 'product_name', l: 'Product' },
                  { k: 'store_name', l: 'Store' },
                  { k: 'bin_code', l: 'Bin' },
                  { k: 'available_qty', l: 'Qty' },
                  { k: 'price', l: 'Price' },
                  { k: 'value', l: 'Value' },
                ].map(({ k, l }) => (
                  <TableHead
                    key={k}
                    onClick={() => {
                      if (k === 'value') return; // computed; skip
                      setSortKey(k as any);
                      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                    }}
                    className={k === 'available_qty' || k === 'price' || k === 'value' ? 'text-right' : ''}
                    style={{ cursor: k !== 'value' ? 'pointer' : 'default' }}
                  >
                    {l}
                    {k !== 'value' && sortKey === k && (
                      <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ color: 'var(--color-text-muted)' }}>Loading…</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ color: 'var(--color-text-muted)' }}>No data</TableCell>
                </TableRow>
              ) : (
                displayRows.map((r) => {
                  const value = Number(r.available_qty) * Number(r.price);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.product_name}</TableCell>
                      <TableCell>{r.store_name}</TableCell>
                      <TableCell>{r.bin_code ?? '-'}</TableCell>
                      <TableCell className="text-right">{r.available_qty}</TableCell>
                      <TableCell className="text-right">₹ {Number(r.price).toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹ {value.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
      </TableCard>
    </div>
  );
};

export default StockOverview;
