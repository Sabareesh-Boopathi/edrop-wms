import React, { useEffect, useMemo, useState } from 'react';
import '../../theme/utilities.css';
import '../inbound/Inbound.css';
import { getWarehouses } from '../../services/warehouseService';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import notify from '../../lib/notify';
import KpiCard from '../../components/KpiCard';
import { Boxes, Package, ClipboardList, Save, X, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Using real backend data; no mock fallback

const StockAdjustment: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const mappedWarehouseId = (user?.warehouse_id ?? localStorage.getItem('AUTH_USER_WAREHOUSE_ID') ?? '') as string;
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [pending, setPending] = useState<Record<string, number>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'product_name' | 'store_name' | 'bin_code' | 'available_qty'>('product_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  // Mock filters (visual only)
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [storeFilter, setStoreFilter] = useState('All Stores');
  const [productFilter, setProductFilter] = useState('All Products');
  const vendorOptions = ['All Vendors', 'Vendor A', 'Vendor B', 'Vendor C'];
  const storeOptions = ['All Stores', 'Store Alpha', 'Store Beta', 'Store Gamma'];
  const productOptions = ['All Products', 'Product One', 'Product Two', 'Product Three'];

  useEffect(() => {
    (async () => {
  let ws = await getWarehouses();
  if (!isAdmin && mappedWarehouseId) ws = ws.filter((w: any) => String(w.id) === String(mappedWarehouseId));
      setWarehouses(ws);
      if (ws.length) setWarehouseId(String(!isAdmin && mappedWarehouseId ? mappedWarehouseId : ws[0].id));
    })();
  }, [isAdmin, mappedWarehouseId]);

  useEffect(() => {
    if (!warehouseId) return;
    api.get(`/warehouses/${warehouseId}/products`).then((res) => {
      const data = res.data;
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      setRows(items);
    });
  }, [warehouseId]);

  const setRowQty = (id: string, qty: number) => setPending((p) => ({ ...p, [id]: qty }));

  const saveRow = async (id: string) => {
    const newQty = pending[id];
    const reason = (reasons[id] || '').trim();
    if (typeof newQty !== 'number') { notify.warn('No change to save'); return; }
    if (!reason) { notify.warn('Please provide a reason'); return; }
    setSaving(true);
    try {
      await api.post('/stores/store-products:batch-adjust', {
        items: [{ store_product_id: id, available_qty: newQty, reason }],
      });
      const res = await api.get(`/warehouses/${warehouseId}/products`);
  const data = res.data;
  const items = Array.isArray(data) ? data : (data?.items ?? []);
  setRows(items);
      setEditing((e) => ({ ...e, [id]: false }));
  setReasons((rs) => { const { [id]: _, ...rest } = rs; return rest; });
      notify.success('Row saved');
    } catch (e) {
      notify.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = (id: string) => {
    setEditing((e) => ({ ...e, [id]: false }));
    setPending((p) => {
      const { [id]: _, ...rest } = p;
      return rest;
    });
  setReasons((rs) => { const { [id]: _, ...rest } = rs; return rest; });
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.product_name.toLowerCase().includes(q) ||
      r.store_name.toLowerCase().includes(q) ||
      (r.bin_code ?? '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  // KPIs
  const kpis = useMemo(() => {
    const uniqueSkus = new Set(rows.map(r => r.product_id)).size;
    const totalQty = rows.reduce((s, r) => s + (Number(r.available_qty) || 0), 0);
    const changedLines = Object.entries(pending).reduce((acc, [id, qty]) => {
      const row = rows.find(r => r.id === id);
      return acc + (row && typeof qty === 'number' && qty !== row.available_qty ? 1 : 0);
    }, 0);
    return { uniqueSkus, totalQty, changedLines };
  }, [rows, pending]);

  // Client-side sorting
  const displayRows = useMemo(() => {
    const arr = [...filteredRows];
    const toKey = (v: any) => (typeof v === 'number' ? v : v == null ? '' : String(v).toLowerCase());
    arr.sort((a: any, b: any) => {
      const ka = toKey(a[sortKey]);
      const kb = toKey(b[sortKey]);
      if (ka < kb) return sortDir === 'asc' ? -1 : 1;
      if (ka > kb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredRows, sortKey, sortDir]);

  const total = displayRows.length;
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return displayRows.slice(start, end);
  }, [displayRows, page, pageSize]);

  return (
    <div className="page-container" style={{ padding: 'var(--space-5)' }}>
      <div className="inbound-header">
        <div>
          <h1>Stock Adjustment</h1>
          <p>Adjust on-hand quantities with reasons and audit trail.</p>
        </div>
        <div className="inline-actions" />
      </div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <KpiCard icon={<Boxes className="icon" />} title="Total SKUs" value={kpis.uniqueSkus} variant="slate" />
        <KpiCard icon={<Package className="icon" />} title="Total Qty" value={kpis.totalQty} variant="indigo" />
        <KpiCard icon={<ClipboardList className="icon" />} title="Changed Lines" value={kpis.changedLines} variant="orange" />
      </div>
  <TableCard
        variant="inbound"
        title="Stock Adjustment"
        warehouse={isAdmin ? (
          <div className="form-field" style={{ maxWidth: 260 }}>
            <label>Warehouse</label>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        ) : undefined}
        search={(
          <div className="form-field" style={{ maxWidth: 340 }}>
            <label>Search</label>
            <input placeholder="Product / Store / Bin" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        )}
  // Reason moved to per-row edit; no header action
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
                  { key: 'product_name', label: 'Product', align: 'left' },
                  { key: 'store_name', label: 'Store', align: 'left' },
                  { key: 'bin_code', label: 'Bin', align: 'left' },
                  { key: 'available_qty', label: 'Current Qty', align: 'right' },
                  { key: null, label: 'New Qty', align: 'right' },
                  { key: null, label: 'Reason', align: 'left' },
                  { key: null, label: '', align: 'left' },
                ].map((col) => (
                  <TableHead
                    key={col.label}
                    onClick={() => {
                      if (!col.key) return;
                      setSortKey(col.key as any);
                      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                    }}
                    style={{ cursor: col.key ? 'pointer' : 'default' }}
                    className={col.align === 'right' ? 'text-right' : ''}
                  >
                    {col.label}
                    {col.key && sortKey === col.key && (
                      <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(pagedRows) ? pagedRows : []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.product_name}</TableCell>
                  <TableCell>{r.store_name}</TableCell>
                  <TableCell>{r.bin_code ?? '-'}</TableCell>
                  <TableCell className="text-right">{r.available_qty}</TableCell>
                  <TableCell className="text-right">
                    {editing[r.id] ? (
                      <input
                        type="number"
                        min={0}
                        defaultValue={r.available_qty}
                        onChange={(e) => setRowQty(r.id, Number(e.target.value))}
                        style={{
                          width: 120,
                          height: 'var(--control-height-sm)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border-strong)',
                          background: 'var(--color-surface)',
                          padding: 'var(--control-padding-y-sm) var(--control-padding-x-sm)'
                        }}
                      />
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editing[r.id] ? (
                      <input
                        placeholder="Reason for adjustment"
                        value={reasons[r.id] || ''}
                        onChange={(e) => setReasons((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        style={{
                          width: 220,
                          height: 'var(--control-height-sm)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border-strong)',
                          background: 'var(--color-surface)',
                          padding: 'var(--control-padding-y-sm) var(--control-padding-x-sm)'
                        }}
                      />
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!editing[r.id] ? (
                      <button
                        type="button"
                        className="btn-outline-token"
                        onClick={() => setEditing((e) => ({ ...e, [r.id]: true }))}
                        title="Edit"
                        aria-label="Edit"
                        style={{
                          width: 'var(--control-height-sm)',
                          height: 'var(--control-height-sm)',
                          padding: 0,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                    ) : (
                      (() => {
                        const newVal = pending[r.id];
                        const changed = typeof newVal === 'number' && newVal !== r.available_qty;
                        return changed ? (
                          <button
                            type="button"
                            className="btn-primary-token"
                            disabled={saving}
                            onClick={() => saveRow(r.id)}
                            title="Save"
                            aria-label="Save"
                            style={{
                              width: 'var(--control-height-sm)',
                              height: 'var(--control-height-sm)',
                              padding: 0,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <Save size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-outline-token"
                            onClick={() => cancelEdit(r.id)}
                            title="Cancel"
                            aria-label="Cancel"
                            style={{
                              width: 'var(--control-height-sm)',
                              height: 'var(--control-height-sm)',
                              padding: 0,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            <X size={16} />
                          </button>
                        );
                      })()
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
      </Table>
    </TableCard>
    </div>
  );
};

export default StockAdjustment;
