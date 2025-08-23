import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../theme/utilities.css';
import '../inbound/Inbound.css';
import './CrateInventory.css';
import { getWarehouses } from '../../services/warehouseService';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import TableCard from '../../components/table/TableCard';
import { motion } from 'framer-motion';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from '../../components/EmptyState';

type WarehouseDTO = { id: string; name: string };
type Crate = { id: string; name: string; status: string; type: string };
type CrateItem = { crate_id: string; product_name: string; qty: number };

const CrateInventory: React.FC = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const mappedWarehouseId = (user?.warehouse_id ?? localStorage.getItem('AUTH_USER_WAREHOUSE_ID') ?? '') as string;
  const [crates, setCrates] = useState<Crate[]>([]);
  const [crateItems, setCrateItems] = useState<CrateItem[]>([]);
  // Pagination state
  const [pageCrates, setPageCrates] = useState(1);
  const [pageSizeCrates, setPageSizeCrates] = useState(10);
  const [pageHeld, setPageHeld] = useState(1);
  const [pageSizeHeld, setPageSizeHeld] = useState(10);

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
    api.get(`/warehouses/${warehouseId}/crates`).then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      setCrates(data);
      // Items API not yet available; leave empty for now
      setCrateItems([]);
      // Reset pagination when data context changes
      setPageCrates(1);
      setPageHeld(1);
    });
  }, [warehouseId]);

  const cratesInUse = useMemo(() => crates.filter(c => c.status === 'in_use'), [crates]);
  // Flatten items held by crates in use
  const heldRows = useMemo(() => {
    const rows: { crate_name: string; product_name: string; qty: number }[] = [];
    for (const c of cratesInUse) {
      const items = crateItems.filter((it) => it.crate_id === c.id);
      for (const it of items) rows.push({ crate_name: c.name, product_name: it.product_name, qty: it.qty });
    }
    return rows;
  }, [cratesInUse, crateItems]);
  // Paged data
  const totalCrates = crates.length;
  const displayCrates = useMemo(() => {
    const start = (pageCrates - 1) * pageSizeCrates;
    return crates.slice(start, start + pageSizeCrates);
  }, [crates, pageCrates, pageSizeCrates]);
  const totalHeld = heldRows.length;
  const displayHeld = useMemo(() => {
    const start = (pageHeld - 1) * pageSizeHeld;
    return heldRows.slice(start, start + pageSizeHeld);
  }, [heldRows, pageHeld, pageSizeHeld]);

  return (
    <div className="page-container" style={{ padding: 'var(--space-5)' }}>
      <div className="inbound-header">
        <div>
          <h1>Crate Inventory</h1>
          <p>Track crates and what items are currently held in active crates.</p>
        </div>
        {isAdmin && (
          <div className="form-field" style={{ maxWidth: 260 }}>
            <label>Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {('name' in w && w.name) ? w.name : w.id}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 'var(--space-4)' }}>
  {/* Crates list */}
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
  <TableCard
          variant="inbound"
          title="Crates"
          footer={totalCrates ? (
            <>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                {totalCrates ? `Showing ${(pageCrates - 1) * pageSizeCrates + 1}-${Math.min(pageCrates * pageSizeCrates, totalCrates)} of ${totalCrates}` : '—'}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-outline-token"
                  onClick={() => setPageCrates((p) => Math.max(1, p - 1))}
                  disabled={pageCrates <= 1}
                  aria-label="Previous page"
                  title="Previous"
                  style={{ width: 'var(--control-height-sm)', height: 'var(--control-height-sm)', padding: 0, display: 'grid', placeItems: 'center' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ minWidth: 32, textAlign: 'center' }}>{pageCrates}</span>
                <button
                  type="button"
                  className="btn-outline-token"
                  onClick={() => setPageCrates((p) => (p * pageSizeCrates < totalCrates ? p + 1 : p))}
                  disabled={pageCrates * pageSizeCrates >= totalCrates}
                  aria-label="Next page"
                  title="Next"
                  style={{ width: 'var(--control-height-sm)', height: 'var(--control-height-sm)', padding: 0, display: 'grid', placeItems: 'center' }}
                >
                  <ChevronRight size={16} />
                </button>
                <select
                  value={pageSizeCrates}
                  onChange={(e) => { setPageSizeCrates(Number(e.target.value)); setPageCrates(1); }}
                  style={{ height: 'var(--control-height-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', background: 'var(--color-surface)', padding: 'var(--control-padding-y-sm) var(--control-padding-x-sm)', fontSize: 'var(--font-size-sm)' }}
                >
                  {[10, 25, 50, 100].map((s) => <option key={s} value={s}>{s}/page</option>)}
                </select>
              </div>
            </>
          ) : null}
        >
          {totalCrates === 0 ? (
            <EmptyState
              title="No Crates"
              message="Crates will appear here after they are created."
              actionLabel="Crate Management"
              onAction={() => navigate('/administration/crate-management')}
              actionClassName="btn-outline-token"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {['Crate', 'Type', 'Status'].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayCrates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell>
                      <span className={`status-chip crate-status crate--${c.status}`}>{c.status.replace('_',' ')}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
  </TableCard>
  </motion.div>

  {/* Items held by crates in use */}
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
  <TableCard
          variant="inbound"
          title="Inventory held by crates in use"
          footer={totalHeld ? (
            <>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                {totalHeld ? `Showing ${(pageHeld - 1) * pageSizeHeld + 1}-${Math.min(pageHeld * pageSizeHeld, totalHeld)} of ${totalHeld}` : '—'}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-outline-token"
                  onClick={() => setPageHeld((p) => Math.max(1, p - 1))}
                  disabled={pageHeld <= 1}
                  aria-label="Previous page"
                  title="Previous"
                  style={{ width: 'var(--control-height-sm)', height: 'var(--control-height-sm)', padding: 0, display: 'grid', placeItems: 'center' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ minWidth: 32, textAlign: 'center' }}>{pageHeld}</span>
                <button
                  type="button"
                  className="btn-outline-token"
                  onClick={() => setPageHeld((p) => (p * pageSizeHeld < totalHeld ? p + 1 : p))}
                  disabled={pageHeld * pageSizeHeld >= totalHeld}
                  aria-label="Next page"
                  title="Next"
                  style={{ width: 'var(--control-height-sm)', height: 'var(--control-height-sm)', padding: 0, display: 'grid', placeItems: 'center' }}
                >
                  <ChevronRight size={16} />
                </button>
                <select
                  value={pageSizeHeld}
                  onChange={(e) => { setPageSizeHeld(Number(e.target.value)); setPageHeld(1); }}
                  style={{ height: 'var(--control-height-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', background: 'var(--color-surface)', padding: 'var(--control-padding-y-sm) var(--control-padding-x-sm)', fontSize: 'var(--font-size-sm)' }}
                >
                  {[10, 25, 50, 100].map((s) => <option key={s} value={s}>{s}/page</option>)}
                </select>
              </div>
            </>
          ) : null}
        >
          {totalHeld === 0 ? (
            <EmptyState title="No crates in use" message="This section shows items currently held in active crates." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {['Crate', 'Product', 'Qty'].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayHeld.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{r.crate_name}</TableCell>
                    <TableCell>{r.product_name}</TableCell>
                    <TableCell>{r.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
  </TableCard>
  </motion.div>
      </div>
    </div>
  );
};

export default CrateInventory;
