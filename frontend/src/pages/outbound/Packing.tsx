import React, { useEffect, useMemo, useState, useCallback } from 'react';
import TableCard from '../../components/table/TableCard';
import EmptyState from '../../components/EmptyState';
import { PackageOpen, AlertTriangle, ClipboardList, CheckCircle, ArrowLeftCircle, Shuffle, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import KpiCard from '../../components/KpiCard';
import '../inbound/Inbound.css';
import './outbound.css';
import * as notify from '../../lib/notify';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useWarehouseSelection } from '../../hooks/useWarehouseSelection';
import {
  fetchPackingQueue,
  sendBackToPicking,
  reassignToteToOrder,
  overrideValidation,
  type PackingTote,
} from '../../services/outboundService';

const PAGE_SIZE = 10;

const Packing: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<PackingTote[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'All' | PackingTote['status']>('All');
  const [logFor, setLogFor] = useState<PackingTote | null>(null);
  const [sortBy, setSortBy] = useState<'arrived' | 'status' | 'tote' | 'order'>('arrived');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { warehouses, warehouseId, setWarehouseId, allowSelection } = useWarehouseSelection();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Optional: pass warehouseId as query param if backend supports in future
      const data = await fetchPackingQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (e: any) {
      notify.error(e?.message || 'Failed to load packing queue');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  // Reload on warehouse change (for admins). Backend may ignore for now, harmless refresh.
  useEffect(() => { if (warehouseId) { void load(); } }, [warehouseId, load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let arr = queue;
    if (statusFilter !== 'All') arr = arr.filter(t => t.status === statusFilter);
    if (!term) return arr;
    return arr.filter(t => t.tote_id.toLowerCase().includes(term) || t.order_id.toLowerCase().includes(term) || t.status.toLowerCase().includes(term));
  }, [queue, q, statusFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      if (sortBy === 'arrived') { av = new Date(a.arrived_at).getTime(); bv = new Date(b.arrived_at).getTime(); }
      else if (sortBy === 'status') { av = a.status; bv = b.status; }
      else if (sortBy === 'tote') { av = a.tote_id; bv = b.tote_id; }
      else if (sortBy === 'order') { av = a.order_id; bv = b.order_id; }
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * (sortDir === 'asc' ? 1 : -1);
      return String(av).localeCompare(String(bv)) * (sortDir === 'asc' ? 1 : -1);
    });
    return arr;
  }, [filtered, sortBy, sortDir]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = useMemo(() => { const s = (page - 1) * PAGE_SIZE; return sorted.slice(s, s + PAGE_SIZE); }, [sorted, page]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  // Metrics
  const mismatches = queue.filter(t => t.status === 'mismatch').length;
  const waiting = queue.filter(t => t.status === 'waiting').length;
  const scanning = queue.filter(t => t.status === 'scanning').length;
  const passed = queue.filter(t => t.status === 'pass').length;

  // Actions
  const viewLogs = (tote: PackingTote) => { setLogFor(tote); };
  const onSendBack = async (toteId: string) => {
    try { await sendBackToPicking(toteId); notify.info(`Sent ${toteId} back to picking`); void load(); }
    catch (e: any) { notify.error(e?.message || 'Failed to send back'); }
  };
  const onReassignOrder = async (toteId: string) => {
    const orderId = window.prompt('Enter new Order ID for this tote');
    if (!orderId) return;
    try { await reassignToteToOrder(toteId, orderId); notify.success(`Reassigned ${toteId} to ${orderId}`); void load(); }
    catch (e: any) { notify.error(e?.message || 'Failed to reassign'); }
  };
  const onOverride = async (toteId: string) => {
    const note = window.prompt('Provide a note for override (optional)') || '';
    try { await overrideValidation(toteId, note); notify.success(`Override recorded for ${toteId}`); void load(); }
    catch (e: any) { notify.error(e?.message || 'Failed to override'); }
  };

  return (
  <div className="page-container inbound-page">
      <div className="inbound-header">
        <div>
          <h1>Packing</h1>
          <p>Validate totes, handle mismatches, and complete packing.</p>
        </div>
    {/* Keep header clean; refresh lives in the card actions */}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <KpiCard icon={<ClipboardList />} title="Waiting" value={waiting} variant="slate" />
        <KpiCard icon={<RefreshCw />} title="Scanning" value={scanning} variant="indigo" />
        <KpiCard icon={<CheckCircle />} title="Pass" value={passed} variant="emerald" />
        <KpiCard icon={<AlertTriangle />} title="Mismatch" value={mismatches} variant="orange" />
      </div>
      <TableCard
        variant="inbound"
        title={<div style={{ display:'flex', alignItems:'center', gap:8 }}><PackageOpen size={18}/> Packing Console</div>}
        warehouse={allowSelection ? (
          <div className="form-field" style={{minWidth: 200}}>
            <label>Warehouse</label>
            <select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        ) : undefined}
        search={
          <div className="form-field" style={{ maxWidth: 340 }}>
            <label>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 8, top: '50%', transform:'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
              <input style={{ paddingLeft: 30 }} placeholder="Tote / Order / Status" value={q} onChange={(e)=>{setQ(e.target.value); setPage(1);}} />
            </div>
          </div>
        }
        actions={<button className="icon-btn" onClick={load} title="Refresh" aria-label="Refresh" disabled={loading}><RefreshCw size={16}/></button>}
        filters={
          <>
            <div className="form-field" style={{ minWidth: 160, flex: '0 1 160px' }}>
              <label>Status</label>
              <select value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value as any); setPage(1); }}>
                <option value="All">All</option>
                <option value="waiting">Waiting</option>
                <option value="scanning">Scanning</option>
                <option value="pass">Pass</option>
                <option value="mismatch">Mismatch</option>
              </select>
            </div>
            <div className="form-field" style={{ minWidth: 160, flex: '0 1 160px' }}>
              <label>Sort</label>
              <div style={{ display:'flex', gap:8 }}>
                <select value={sortBy} onChange={e=> setSortBy(e.target.value as any)} style={{ flex:'1 1 auto' }}>
                  <option value="arrived">Arrived</option>
                  <option value="status">Status</option>
                  <option value="tote">Tote</option>
                  <option value="order">Order</option>
                </select>
                <select value={sortDir} onChange={e=> setSortDir(e.target.value as any)} style={{ width: 90 }}>
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
            </div>
          </>
        }
        footer={
          <>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{`Showing ${filtered.length ? Math.min(filtered.length, (page-1)*PAGE_SIZE+1) : 0}-${filtered.length ? Math.min(page*PAGE_SIZE, filtered.length) : 0} of ${filtered.length}`}</span>
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className="pager-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page" title="Previous"><ChevronLeft size={16}/></button>
              <span style={{ minWidth: 32, textAlign: 'center', fontSize: 12 }}>{page}/{pageCount}</span>
              <button type="button" className="pager-btn" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount} aria-label="Next page" title="Next"><ChevronRight size={16}/></button>
            </div>
          </>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="inbound-table pack-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Tote</th>
                <th className="px-4 py-2 text-left">Order</th>
                <th className="px-4 py-2 text-left">Arrived</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Logs</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6"><LoadingOverlay label="Loading packing queue" /></td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6">
                    <EmptyState icon={<ClipboardList />} title="No totes in validation" message="Validated or incoming totes will appear here." actionLabel="Refresh" onAction={load} actionClassName="btn-outline-token" />
                  </td>
                </tr>
              ) : null}
              {paged.map(t => (
                <tr key={t.tote_id}>
                  <td className="px-4 py-2" style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{t.tote_id}</td>
                  <td className="px-4 py-2" style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{t.order_id}</td>
                  <td className="px-4 py-2" title={new Date(t.arrived_at).toLocaleString()}>{new Date(t.arrived_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</td>
                  <td className="px-4 py-2">
                    <span className={`chip chip-pack-${t.status}`}>{t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span>
                    {t.status === 'mismatch' ? (
                      <span className="chip chip-pack-alert" style={{ marginLeft:8 }}><AlertTriangle size={12}/> Alert</span>
                    ) : t.status === 'pass' ? (
                      <span className="chip chip-pack-ok" style={{ marginLeft:8 }}><CheckCircle size={12}/> OK</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    <button type="button" className="action-link primary" onClick={() => viewLogs(t)}>
                      View logs ({t.scan_logs?.length || 0})
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <div style={{ display:'inline-flex', gap:10, whiteSpace:'nowrap' }}>
                      <button type="button" className="action-link primary" onClick={() => onReassignOrder(t.tote_id)}><Shuffle size={16}/> Reassign</button>
                      <button type="button" className="action-link danger" onClick={() => onSendBack(t.tote_id)}><ArrowLeftCircle size={16}/> Send Back</button>
                      {t.status === 'mismatch' ? (
                        <button type="button" className="action-link success" onClick={() => onOverride(t.tote_id)}>Override</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>

      {logFor && (
        <div className="inbound-modal-overlay" onClick={() => setLogFor(null)}>
          <div className="inbound-modal" onClick={e => e.stopPropagation()} style={{maxWidth: 720}}>
            <div className="inbound-modal-header">
              <h2 className="inbound-modal-title">Scan Logs: {logFor.tote_id}</h2>
              <button className="btn-outline-token" onClick={() => setLogFor(null)}>Close</button>
            </div>
            <div className="inbound-modal-body" style={{gap: 8}}>
              {(!logFor.scan_logs || logFor.scan_logs.length === 0) ? (
                <div className="empty-hint">No logs for this tote.</div>
              ) : (
                <table className="inbound-table">
                  <thead>
                    <tr>
                      <th style={{width:160}}>Timestamp</th>
                      <th>Code</th>
                      <th>Result</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logFor.scan_logs!.map((l, i) => (
                      <tr key={i}>
                        <td>{new Date(l.ts).toLocaleString()}</td>
                        <td style={{fontFamily:'ui-monospace, Menlo, monospace'}}>{l.code}</td>
                        <td>{l.ok ? <span className="chip chip-pack-ok"><CheckCircle size={12}/> OK</span> : <span className="chip chip-pack-alert"><AlertTriangle size={12}/> Fail</span>}</td>
                        <td>{l.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="inbound-modal-footer" style={{justifyContent:'flex-end'}}>
              <button className="btn-outline-token" onClick={() => setLogFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packing;
