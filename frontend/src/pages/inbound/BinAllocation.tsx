import React, { useEffect, useMemo, useState } from 'react';
import { Search, Boxes, Grid3x3, ClipboardCheck, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import '../../pages/inbound/Inbound.css';
import TableCard from '../../components/table/TableCard';
import KpiCard from '../../components/KpiCard';
import EmptyState from '../../components/EmptyState';
import { useInboundData } from '../../hooks/useInboundData';
import { useWarehouseSelection } from '../../hooks/useWarehouseSelection';
import { Receipt, ReceiptLine } from '../../types/inbound';
import { StatusChip } from '../../components/inbound/StatusChip';
import DeltaTime from '../../components/inbound/DeltaTime';
import { progressReceipt, autoAllocateReceiptBins, reassignLineBin, clearLineBin } from '../../services/inboundService';
import * as notify from '../../lib/notify';
import LoadingOverlay from '../../components/LoadingOverlay';
import { formatBinCode, isRackAvailable, isBinAvailable, getAllocationStatus } from '../../utils/binUtils';

// Receipts eligible for bin allocation are those that completed QC and moved to ALLOCATED
const eligibleStatuses: Array<Receipt['status']> = ['ALLOCATED'];

const BinAllocation: React.FC = () => {
  const { receipts, kpis, loading, error, reload, setFilter, filter } = useInboundData();
  const { warehouses, warehouseId, setWarehouseId, allowSelection } = useWarehouseSelection();
  const [search, setSearch] = useState(filter.search || '');
  const [show, setShow] = useState<Receipt | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const list = useMemo(() => receipts.filter(r => eligibleStatuses.includes(r.status)), [receipts]);
  const pendingLines = useMemo(() => list.reduce((acc, r) => acc + r.lines.filter(l => !l.bin_id).length, 0), [list]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page, pageSize]);

  function applyFilters() {
    setFilter({ search: search || undefined, warehouseId: warehouseId || undefined });
  }

  useEffect(() => { setPage(1); }, [search, warehouseId, list.length]);

  return (
    <div className="inbound-page">
      <div className="inbound-header">
        <div>
          <h1>Bin Allocation</h1>
          <p>Assign received items to warehouse bins before putaway.</p>
        </div>
        <div style={{display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap'}}>
          {allowSelection && (
            <div className="form-field" style={{minWidth:220}}>
              <label>Warehouse</label>
              <select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}
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
      </div>

      <div className="inbound-kpis">
        {kpis ? (
          <>
            <KpiCard icon={<Boxes className="icon" />} title="Eligible Receipts" value={list.length} variant="slate" />
            <KpiCard icon={<Grid3x3 className="icon" />} title="Lines Unassigned" value={pendingLines} variant="orange" />
            <KpiCard icon={<ClipboardCheck className="icon" />} title="Allocated Receipts" value={kpis.binsAllocated} variant="emerald" />
            <KpiCard icon={<CheckCircle2 className="icon" />} title="Completed Today" value={kpis.completedToday} variant="indigo" />
          </>
        ) : (
          <div className="empty-hint" style={{gridColumn:'1 / -1'}}>
            <LoadingOverlay label="Loading KPIs" />
          </div>
        )}
      </div>

  <TableCard
        variant="inbound"
        title={(
          <>
            Awaiting Allocation
            {error && <span style={{color:'var(--color-error)', marginLeft:8}}>{error}</span>}
          </>
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
        footer={list.length > 0 ? (
          <>
            <div className="empty-hint">
              {`Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, list.length)} of ${list.length}`}
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
                onClick={() => setPage(p => (p * pageSize < list.length ? p + 1 : p))}
                disabled={page * pageSize >= list.length}
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
        {loading && (
          <LoadingOverlay label="Loading receipts" />
        )}
        {list.length === 0 && !loading ? (
          <EmptyState title="Nothing to allocate" message="Receipts will appear here once QC is completed." />
        ) : (
          <table className="inbound-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Lines</th>
                <th>Allocation</th>
                <th>Unassigned</th>
                <th>Planned</th>
                <th>Δ Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.map(r => {
                const unassigned = r.lines.filter(l => !l.bin_id).length;
                const allocationStatus = getAllocationStatus(r.lines);
                const allocationColor = allocationStatus === 'Allocated' ? 'var(--color-success)' 
                  : allocationStatus === 'Partial' ? 'var(--color-warning)' 
                  : 'var(--color-text-soft)';
                return (
                  <tr key={r.id} className="appearing">
                    <td>{r.code || r.id}</td>
                    <td>{r.vendor_name} ({r.vendor_type})</td>
                    <td><StatusChip status={r.status} /></td>
                    <td>{r.lines.length}</td>
                    <td style={{color: allocationColor}}>{allocationStatus}</td>
                    <td style={{color: unassigned>0 ? 'var(--color-warning)' : 'var(--color-text-soft)'}}>{unassigned}</td>
                    <td>{r.planned_arrival ? new Date(r.planned_arrival).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                    <td><DeltaTime receipt={r} refreshMs={30000} /></td>
                    <td style={{textAlign:'right'}}>
                      <button className="btn-primary-token" onClick={()=>setShow(r)}>Allocate Bins</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      {show && (
        <AllocateModal receipt={show} onClose={()=>setShow(null)} onSaved={async()=>{ await reload(); setShow(null); }} />)
      }
    </div>
  );
};

export default BinAllocation;

// Modal to allocate bins per line
const AllocateModal: React.FC<{ receipt: Receipt; onClose: ()=>void; onSaved: ()=>void }> = ({ receipt, onClose, onSaved }) => {
  const [lines, setLines] = useState<ReceiptLine[]>(() => receipt.lines);
  const [saving, setSaving] = useState(false);

  const allAssigned = useMemo(() => lines.length > 0 && lines.every(l => !!l.bin_id), [lines]);

  const doAutoAllocate = async () => {
    setSaving(true);
    try {
      const updated = await autoAllocateReceiptBins(receipt.id);
      if (updated) {
        setLines(updated.lines);
  notify.success('Auto-allocated bins for unassigned lines');
      }
    } catch (e) {
  notify.error('Failed to auto-allocate bins');
    } finally { setSaving(false); }
  };

  const doReassign = async (lineId: string) => {
    setSaving(true);
    try {
      const l = await reassignLineBin(lineId);
      if (l) setLines(prev => prev.map(x => x.id === lineId ? { ...x, bin_id: l.bin_id } : x));
    } catch (e) {
  notify.error('Failed to reassign bin');
    } finally { setSaving(false); }
  };

  const doClear = async (lineId: string) => {
    setSaving(true);
    try {
      const l = await clearLineBin(lineId);
      if (l) setLines(prev => prev.map(x => x.id === lineId ? { ...x, bin_id: undefined } : x));
    } catch (e) {
  notify.error('Failed to clear bin');
    } finally { setSaving(false); }
  };

  const complete = async () => {
  if (!allAssigned) { notify.error('Assign bins to all lines first'); return; }
    setSaving(true);
    try {
      // Move to READY_FOR_PICKING as putaway-ready
      await progressReceipt(receipt.id); // from ALLOCATED -> READY_FOR_PICKING
  notify.success('Allocation completed');
      await onSaved();
    } catch (e) {
  notify.error('Failed to complete allocation');
    } finally { setSaving(false); }
  };

  return (
    <div className="inbound-modal-overlay" onClick={onClose}>
      <div className="inbound-modal" onClick={e=>e.stopPropagation()} style={{maxWidth: 900}}>
        <div className="inbound-modal-header">
          <h2 className="inbound-modal-title">Allocate Bins: {receipt.id}</h2>
          <div style={{display:'flex', gap:8}}>
            <button className="btn-outline-token" onClick={doAutoAllocate} disabled={saving}>Auto-allocate</button>
            <button className="btn-outline-token" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="inbound-modal-body" style={{gap:12}}>
          <table className="inbound-table">
            <thead>
              <tr>
                <th style={{minWidth:220}}>Item / Customer</th>
                <th>Qty</th>
                <th>Bin</th>
                <th style={{width:180}}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map(l => (
                <tr key={l.id}>
                  <td>{l.product_name || l.customer_name || l.product_sku}</td>
                  <td>{l.quantity}</td>
                  <td style={{color: l.bin_id ? 'inherit' : 'var(--color-warning)'}}>
                    {l.bin_id ? (
                      l.bin_code && l.bin_code.includes('-') ? l.bin_code : (l.bin_id || 'Assigned')
                    ) : 'Unassigned'}
                  </td>
                  <td style={{textAlign:'right'}}>
                    <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                      <button className="btn-outline-token" onClick={()=>doReassign(l.id)} disabled={saving}>Reassign</button>
                      <button className="btn-outline-token" onClick={()=>doClear(l.id)} disabled={saving || !l.bin_id}>Clear</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!allAssigned && <div className="empty-hint" style={{marginTop:8}}>Tip: Use Auto-allocate or Reassign to fill all bins before completing.</div>}
        </div>
        <div className="inbound-modal-footer" style={{justifyContent:'space-between'}}>
          <div />
          <div style={{display:'flex', gap:8}}>
            <button className="btn-primary-token" onClick={complete} disabled={saving || !allAssigned}>
              Complete Allocation <ArrowRight size={16} style={{marginLeft:6}} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
