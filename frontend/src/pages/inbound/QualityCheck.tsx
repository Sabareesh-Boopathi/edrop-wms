import React, { useEffect, useMemo, useState } from 'react';
import { Search, ClipboardCheck, AlertTriangle, CheckCircle2, Package, Clock, ArrowRight, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import '../../pages/inbound/Inbound.css';
import TableCard from '../../components/table/TableCard';
import EmptyState from '../../components/EmptyState';
import KpiCard from '../../components/KpiCard';
import { useInboundData } from '../../hooks/useInboundData';
import { useWarehouseSelection } from '../../hooks/useWarehouseSelection';
import { Receipt, ReceiptLine, ReceiptStatus } from '../../types/inbound';
import { computeKpis, flagLineIssues, progressReceipt, updateReceiptStatus, setReceivedQty, acknowledgeDiff, setDamageOrigin } from '../../services/inboundService';
import { getSystemConfig, getWarehouseConfig } from '../../services/configService';
import { StatusChip } from '../../components/inbound/StatusChip';
import DeltaTime from '../../components/inbound/DeltaTime';
import * as notify from '../../lib/notify';

// QC should start post-unloading at the bay
const qcStatuses: ReceiptStatus[] = ['MOVED_TO_BAY'];

const QualityCheck: React.FC = () => {
  const { receipts, kpis, loading, error, reload, setFilter, filter } = useInboundData();
  const [search, setSearch] = useState(filter.search || '');
  const [show, setShow] = useState<Receipt | null>(null);
  const { warehouses, warehouseId, setWarehouseId } = useWarehouseSelection();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const qcList = useMemo(() => receipts.filter(r => qcStatuses.includes(r.status)), [receipts]);
  const exceptionsCount = useMemo(() => qcList.reduce((acc, r) => acc + r.lines.filter(l => ((l.received_qty ?? l.quantity) !== l.quantity) || (l.damaged||0) > 0).length, 0), [qcList]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return qcList.slice(start, start + pageSize);
  }, [qcList, page, pageSize]);

  function applyFilters() {
    setFilter({ search: search || undefined, warehouseId: warehouseId || undefined });
  }

  useEffect(() => { setPage(1); }, [search, warehouseId, qcList.length]);

  return (
    <div className="inbound-page">
      <div className="inbound-header">
        <div>
          <h1>Quality Check</h1>
          <p>Inspect and verify incoming goods; flag damages/missing and complete QC.</p>
        </div>
        <div className="inline-actions">
          <button
            className="icon-btn"
            title={loading ? 'Refreshing…' : 'Refresh'}
            aria-label="Refresh"
            onClick={reload}
            disabled={loading}
          >
            <RotateCw size={18} />
          </button>
        </div>
      </div>

      <div className="inbound-kpis">
        {kpis ? (
          <>
            <KpiCard icon={<ClipboardCheck className="icon" />} title="Pending QC" value={qcList.length} variant="indigo" />
            <KpiCard icon={<AlertTriangle className="icon" />} title="Exceptions" value={exceptionsCount} variant="orange" />
            <KpiCard icon={<Package className="icon" />} title="Total Receipts" value={kpis.totalReceipts} variant="slate" />
            <KpiCard icon={<CheckCircle2 className="icon" />} title="Completed Today" value={kpis.completedToday} variant="emerald" />
            <KpiCard icon={<Clock className="icon" />} title="Pending" value={kpis.pending} variant="pink" />
          </>
        ) : (
          <div className="empty-hint">Loading KPIs…</div>
        )}
      </div>

      <TableCard
        variant="inbound"
        title={(
          <>
            Receipts for QC
            {loading && <span style={{fontSize:12, marginLeft:8}}>Loading…</span>}
            {error && <span style={{color:'var(--color-error)', marginLeft:8}}>{error}</span>}
          </>
        )}
        warehouse={(
          <div className="form-field" style={{maxWidth:240}}>
            <label>Warehouse</label>
            <select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        search={(
          <div className="form-field" style={{maxWidth:320}}>
            <label>Search</label>
            <div style={{position:'relative'}}>
              <Search size={16} style={{position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-subtle)'}} />
              <input style={{paddingLeft:30}} value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&applyFilters()} placeholder="ID / Vendor / SKU / Customer" />
            </div>
          </div>
        )}
        footer={qcList.length > 0 ? (
          <>
            <div className="empty-hint" style={{visibility: qcList.length ? 'visible' : 'hidden'}}>
              {qcList.length ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, qcList.length)} of ${qcList.length}` : '—'}
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <button
                className="icon-btn"
                aria-label="Previous page"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="page-indicator">{page}</div>
              <button
                className="icon-btn"
                aria-label="Next page"
                onClick={() => setPage(p => (p * pageSize < qcList.length ? p + 1 : p))}
                disabled={page * pageSize >= qcList.length}
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
              <select
                className="page-size"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </>
        ) : undefined}
      >
        {qcList.length === 0 && !loading ? (
          <EmptyState title="Nothing to QC" message="QC starts once unloading is completed and receipt is moved to bay." />
        ) : (
          <table className="inbound-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Lines</th>
                <th>Exceptions</th>
                <th>Planned</th>
                <th>Δ Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.map(r => {
                const excLines = r.lines.filter(l => (l.damaged||0) > 0 || (l.missing||0) > 0).length;
                return (
                  <tr key={r.id} className="appearing">
                    <td>{r.id}</td>
                    <td>{r.vendor_name} ({r.vendor_type})</td>
                    <td><StatusChip status={r.status} /></td>
                    <td>{r.lines.length}</td>
                    <td style={{color: excLines>0 ? 'var(--color-error)' : 'var(--color-text-soft)'}}>{excLines}</td>
                    <td>{r.planned_arrival ? new Date(r.planned_arrival).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                    <td><DeltaTime receipt={r} refreshMs={30000} /></td>
                    <td style={{textAlign:'right'}}>
                      <button className="btn-primary-token" onClick={()=>setShow(r)}>Open QC</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      {show && (
        <QcModal receipt={show} onClose={()=>setShow(null)} onSaved={async()=>{ await reload(); setShow(null); }} />
      )}
    </div>
  );
};

export default QualityCheck;

// QC Modal
const QcModal: React.FC<{ receipt: Receipt; onClose: ()=>void; onSaved: ()=>void }> = ({ receipt, onClose, onSaved }) => {
  const [lines, setLines] = useState<ReceiptLine[]>(() => receipt.lines.map(l => ({ received_qty: l.received_qty ?? l.quantity, ...l })));
  const [policy, setPolicy] = useState<{ hold_days: number; after: 'DISPOSE' | 'CHARITY' }>(receipt.overs_policy || { hold_days: 3, after: 'DISPOSE' });
  const [loadingPolicy, setLoadingPolicy] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPolicy(true);
        // TODO: Wire current warehouseId from context/store when available
        const [wh, sys] = await Promise.all([
          getWarehouseConfig('default'),
          getSystemConfig(),
        ]);
        const source = wh.inboundOversPolicy || sys.inboundOversPolicy;
        if (mounted && source) setPolicy(source);
      } finally { setLoadingPolicy(false); }
    })();
    return () => { mounted = false; };
  }, []);
  const [saving, setSaving] = useState(false);

  const setLine = (id: string, patch: Partial<ReceiptLine>) => {
    setLines(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const exceptions = useMemo(() => lines.filter(l => (l.damaged||0) > 0 || (l.missing||0) > 0).length, [lines]);

  const saveChanges = async () => {
    setSaving(true);
    try {
      const changed = lines.filter(l => {
        const orig = receipt.lines.find(x => x.id === l.id)!;
        return (orig.damaged||0) !== (l.damaged||0) || (orig.notes||'') !== (l.notes||'') || (orig.received_qty||orig.quantity) !== (l.received_qty||l.quantity) || (orig.ack_diff||false)!==(l.ack_diff||false) || (orig.damaged_origin||'') !== (l.damaged_origin||'');
      });
  await Promise.all(changed.map(async l => {
        await flagLineIssues(l.id, l.damaged||0, l.missing||0, l.notes);
        await setReceivedQty(l.id, l.received_qty ?? l.quantity);
        if (l.ack_diff !== undefined) await acknowledgeDiff(l.id, !!l.ack_diff);
        if (l.damaged !== undefined && l.damaged > 0 && l.damaged_origin) await setDamageOrigin(l.id, l.damaged_origin);
      }));
  notify.success('QC updates saved');
      await onSaved();
    } catch (e) {
  notify.error('Failed to save QC');
    } finally {
      setSaving(false);
    }
  };

  const markAllOk = () => {
    setLines(ls => ls.map(l => ({ ...l, damaged: 0, missing: 0, received_qty: l.quantity, ack_diff: true })));
  };

  const completeQc = async () => {
    setSaving(true);
    try {
      // Validate acks and damage origin
      const needAck = lines.filter(l => (l.received_qty ?? l.quantity) !== l.quantity && !l.ack_diff);
      const needOrigin = lines.filter(l => (l.damaged||0) > 0 && !l.damaged_origin);
      if (needAck.length || needOrigin.length) {
        setSaving(false);
  notify.error(`${needAck.length?`${needAck.length} line(s) require diff acknowledgement. `:''}${needOrigin.length?`${needOrigin.length} line(s) require damage origin.`:''}`);
        return;
      }
      // Save any pending changes first
      await saveChanges();
      // Progress status to ALLOCATED
      if (receipt.status === 'UNLOADING') {
        await progressReceipt(receipt.id); // -> MOVED_TO_BAY
        await progressReceipt(receipt.id); // -> ALLOCATED
      } else if (receipt.status === 'MOVED_TO_BAY') {
        await progressReceipt(receipt.id); // -> ALLOCATED
      } else {
        await updateReceiptStatus(receipt.id, 'ALLOCATED');
      }
  notify.success('QC completed');
      await onSaved();
    } catch (e) {
  notify.error('Failed to complete QC');
    } finally { setSaving(false); }
  };

  return (
    <div className="inbound-modal-overlay" onClick={onClose}>
      <div className="inbound-modal" onClick={e=>e.stopPropagation()} style={{maxWidth: 980}}>
        <div className="inbound-modal-header">
          <h2 className="inbound-modal-title">QC: {receipt.id}</h2>
          <button className="btn-outline-token" onClick={onClose}>Close</button>
        </div>
        <div className="inbound-modal-body" style={{gap:16}}>
          <div style={{display:'flex', flexWrap:'wrap', gap:16}}>
            <div style={{flex:'1 1 260px'}}>
              <p style={{margin:'4px 0'}}><strong>Vendor:</strong> {receipt.vendor_name} ({receipt.vendor_type})</p>
              <p style={{margin:'4px 0'}}><strong>Status:</strong> <StatusChip status={receipt.status} /></p>
              <p style={{margin:'4px 0'}}><strong>Planned:</strong> {receipt.planned_arrival ? new Date(receipt.planned_arrival).toLocaleString() : '—'}</p>
              <p style={{margin:'4px 0'}}><strong>Lines:</strong> {lines.length}</p>
              <p style={{margin:'4px 0'}}><strong>Exceptions:</strong> {exceptions}</p>
            </div>
          </div>
          <div>
            <h4 style={{margin:'8px 0'}}>Line QC</h4>
    <table className="inbound-table" style={{marginTop:4}}>
              <thead>
                <tr>
                  <th style={{minWidth:200}}>Item / Customer</th>
                  <th>Planned</th>
                  <th>Received</th>
                  <th>Short/Over</th>
                  <th>Damaged</th>
                  <th>Damage Origin</th>
                  <th>Notes</th>
                  <th>Ack</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(l => {
                  const planned = l.quantity;
                  const received = l.received_qty ?? planned;
                  const diff = (received - planned);
                  const hasDiff = diff !== 0;
      const exception = hasDiff || (l.damaged||0) > 0;
                  return (
                    <tr key={l.id} style={exception?{background:'color-mix(in srgb, var(--color-error) 8%, transparent)'}:undefined}>
                      <td>{l.product_name || l.customer_name || l.product_sku}</td>
                      <td>{planned}</td>
                      <td>
                        <input type="number" min={0} style={{width:64}} value={received} onChange={e=>setLine(l.id, { received_qty: Math.max(0, Number(e.target.value||0)) })} />
                      </td>
                      <td style={{color: diff<0 ? 'var(--color-error)' : diff>0 ? 'var(--color-warning)' : 'var(--color-text-soft)'}}>
                        {diff<0 ? `${Math.abs(diff)} short` : diff>0 ? `${diff} over` : '—'}
                      </td>
                      <td>
                        <input type="number" min={0} style={{width:64}} value={l.damaged||0} onChange={e=>setLine(l.id, { damaged: Math.max(0, Number(e.target.value||0)) })} />
                      </td>
                      <td>
                        <select value={l.damaged_origin||''} onChange={e=>setLine(l.id,{ damaged_origin: e.target.value as any })}>
                          <option value="">Select</option>
                          <option value="UNLOADING">Unloading</option>
                          <option value="WAREHOUSE">Warehouse</option>
                        </select>
                      </td>
                      <td>
                        <input placeholder="Notes" value={l.notes||''} onChange={e=>setLine(l.id, { notes: e.target.value })} />
                      </td>
                      <td>
                        <input type="checkbox" checked={!!l.ack_diff} onChange={e=>setLine(l.id, { ack_diff: e.target.checked })} title="Acknowledge difference" />
                      </td>
                    </tr>
                  );
                })}
                {/* Totals */}
                <tr>
                  <td style={{fontWeight:700}}>Totals</td>
                  <td>{lines.reduce((s,l)=>s+l.quantity,0)}</td>
                  <td>{lines.reduce((s,l)=>s+(l.received_qty??l.quantity),0)}</td>
                  <td>
                    {(() => {
                      const planned = lines.reduce((s,l)=>s+l.quantity,0);
                      const received = lines.reduce((s,l)=>s+(l.received_qty??l.quantity),0);
                      const diff = received - planned;
                      return diff<0 ? `${Math.abs(diff)} short` : diff>0 ? `${diff} over` : '—';
                    })()}
                  </td>
                  <td>{lines.reduce((s,l)=>s+(l.damaged||0),0)}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div style={{marginTop:12, fontSize:12, color:'var(--color-text-subtle)'}}>Note: Shorts are vendor responsibility; Overs will be held temporarily.</div>
          </div>
          <div className="inbound-card" style={{marginTop:8}}>
            <div className="inbound-card-content" style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
              <span className="status-chip" title="Configured in System Configuration">
                Overs Policy: Hold {policy.hold_days} day(s), then {policy.after === 'DISPOSE' ? 'Dispose' : 'Charity'}
              </span>
            </div>
          </div>
        </div>
        <div className="inbound-modal-footer" style={{justifyContent:'space-between'}}>
          <div style={{display:'flex', gap:8}}>
            <button className="btn-outline-token" onClick={markAllOk} disabled={saving}>Mark All OK</button>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn-outline-token" onClick={saveChanges} disabled={saving}>Save Changes</button>
            <button className="btn-primary-token" onClick={completeQc} disabled={saving}>
              Complete QC <ArrowRight size={16} style={{marginLeft:6}} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
