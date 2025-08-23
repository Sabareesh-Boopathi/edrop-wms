import React, { useEffect, useMemo, useState, useCallback } from 'react';
import KpiCard from '../../components/KpiCard';
import TableCard from '../../components/table/TableCard';
import EmptyState from '../../components/EmptyState';
import UtilizationBar from '../../components/outbound/UtilizationBar';
import { Search, ListChecks, User, MapPin, Play, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Pause, StopCircle } from 'lucide-react';
import * as notify from '../../lib/notify';
import LoadingOverlay from '../../components/LoadingOverlay';
import '../inbound/Inbound.css';
import './outbound.css';
import { fetchPickTasks, type PickTask } from '../../services/outboundService';
import './outbound.css';

type PickRow = {
  order_id: string;
  tote_ids: string[]; // consolidated totes
  sku_count: number;
  location: string;
  priority: 'Low' | 'Medium' | 'High';
  picker?: string;
  utilizationPct: number; // 0-100
  status: 'Pending' | 'InProgress' | 'Completed';
};

// Compact Tote(s) cell with hover/click popover listing all totes
const TotesCell: React.FC<{ ids: string[]; multi: boolean }> = ({ ids, multi }) => {
  const [open, setOpen] = useState(false);
  const first = ids[0];
  const extra = Math.max(0, ids.length - 1);
  return (
    <div className="totes-wrap" onMouseLeave={() => setOpen(false)}>
    <span className="chip chip-tote">{first}</span>
      {extra > 0 && (
        <button
          type="button"
      className="chip chip-tote"
          onClick={() => setOpen(v => !v)}
          onMouseEnter={() => setOpen(true)}
          title={ids.join(', ')}
          style={{ cursor:'pointer' }}
        >
          +{extra}
        </button>
      )}
    {multi ? <span className="chip chip-type">Multi</span> : <span className="chip chip-type">Single</span>}
      {open && extra > 0 && (
        <div className="totes-popover" role="dialog" aria-label="Tote list">
          <div className="totes-popover-title">Totes</div>
          <div className="totes-grid">
            {ids.map(t => (
        <div key={t} className="chip chip-tote">{t}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const mapPickTasksToRows = (tasks: PickTask[]): PickRow[] => {
  // Group by order_id and aggregate totes; estimate utilization from sku_count
  const byOrder = new Map<string, PickRow>();
  for (const t of tasks) {
    const status = t.status === 'completed' ? 'Completed' : t.status === 'in_progress' ? 'InProgress' : 'Pending';
    const utilizationPct = Math.min(100, Math.max(10, (t.sku_count || 0) * 8));
    const existing = byOrder.get(t.order_id);
    if (existing) {
      existing.tote_ids.push(t.tote_id);
      existing.sku_count += t.sku_count || 0;
      existing.picker = existing.picker || t.picker;
      existing.status = existing.status === 'Completed' ? 'Completed' : status; // keep max state
    } else {
      byOrder.set(t.order_id, {
        order_id: t.order_id,
        tote_ids: [t.tote_id],
        sku_count: t.sku_count || 0,
        location: 'staging',
        priority: 'Medium',
        picker: t.picker,
        utilizationPct,
        status,
      });
    }
  }
  return Array.from(byOrder.values());
};

const PAGE_SIZE = 10;

const PickList: React.FC = () => {
  const [rows, setRows] = useState<PickRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'All'|'Assigned'|'Unassigned'>('All');
  const [completeFor, setCompleteFor] = useState<PickRow | null>(null);
  const [completeLines, setCompleteLines] = useState<Array<{ sku: string; name: string; planned: number; picked: number }>>([]);
  const [shortsConfirm, setShortsConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tasks = await fetchPickTasks();
      setRows(mapPickTasksToRows(tasks));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    let arr = [...rows];
    const term = q.trim().toLowerCase();
    if (term) arr = arr.filter(r => r.order_id.toLowerCase().includes(term) || r.tote_ids.join(',').toLowerCase().includes(term) || (r.picker||'').toLowerCase().includes(term) || r.location.toLowerCase().includes(term));
    if (statusFilter === 'Assigned') arr = arr.filter(r => !!r.picker);
    if (statusFilter === 'Unassigned') arr = arr.filter(r => !r.picker);
    return arr;
  }, [rows, q, statusFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = useMemo(() => { const s = (page - 1) * PAGE_SIZE; return filtered.slice(s, s + PAGE_SIZE); }, [filtered, page]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  // KPIs
  const kpiTotal = rows.length;
  const kpiCompleted = rows.filter(r => r.status === 'Completed').length;
  const kpiPending = Math.max(0, kpiTotal - kpiCompleted);

  // Actions
  const onStartPicking = (orderId: string) => { notify.info(`Start picking ${orderId}`); };
  const onPausePicking = (orderId: string) => { notify.info(`Pause ${orderId}`); };
  const onStopPicking = (orderId: string) => { notify.info(`Stop ${orderId}`); };
  const openCompleteModal = (row: PickRow) => {
    // Generate mock lines for confirmation based on sku_count
    const lineCount = Math.min(5, Math.max(1, Math.ceil(row.sku_count / 3)));
    const lines = Array.from({ length: lineCount }).map((_, i) => {
      const planned = Math.max(1, Math.min(5, Math.ceil(row.sku_count / lineCount) - (i % 2)));
      return {
        sku: `${row.order_id.replace('ORD-','SKU-')}-${i+1}`,
        name: `Item ${i+1}`,
        planned,
        picked: planned,
      };
    });
    setCompleteLines(lines);
    setCompleteFor(row);
  };
  const confirmComplete = () => {
    if (!completeFor) return;
    const mismatch = completeLines.filter(l => l.picked !== l.planned);
    if (mismatch.length) { setShortsConfirm(true); return; }
  notify.success(`Marked ${completeFor.order_id} completed`);
    setCompleteFor(null);
  };
  const proceedCompleteWithShorts = () => {
  if (!completeFor) return;
  notify.warn(`Completed ${completeFor.order_id} with shorts`);
    setShortsConfirm(false);
    setCompleteFor(null);
  };

  return (
    <div className="page-container inbound-page">
      <div className="inbound-header">
        <div>
          <h1>Pick List</h1>
          <p>Search, filter, and manage active pick orders. Monitor tote utilization for efficient closure.</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <KpiCard icon={<ListChecks />} title="Total Orders" value={kpiTotal} variant="slate" />
        <KpiCard icon={<CheckCircle />} title="Completed" value={kpiCompleted} variant="emerald" />
        <KpiCard icon={<AlertTriangle />} title="Pending" value={kpiPending} variant="orange" />
      </div>

      <TableCard
        variant="inbound"
  title={<div style={{ display:'flex', alignItems:'center', gap:8 }}><ListChecks size={18}/> Active Pick Orders</div>}
  warehouse={undefined}
        search={
          <div className="form-field" style={{ maxWidth: 360 }}>
            <label>Search</label>
            <div style={{ position:'relative' }}>
              <Search size={16} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-subtle)' }}/>
              <input style={{ paddingLeft: 30 }} placeholder="Order / Tote / Picker / Location" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(1); }} />
            </div>
          </div>
        }
        filters={
          <>
            <div className="form-field" style={{ minWidth: 160, width: 'auto', flex: '0 0 auto' }}>
              <label>Status</label>
              <select value={statusFilter} onChange={(e)=>{ setStatusFilter(e.target.value as any); setPage(1); }}>
                <option value="All">All</option>
                <option value="Assigned">Assigned</option>
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>
          </>
        }
        footer={
          <>
            <span style={{ fontSize:12, color:'var(--color-text-muted)' }}>
              {`Showing ${total ? Math.min(total, (page-1)*PAGE_SIZE+1) : 0}-${total ? Math.min(page*PAGE_SIZE, total) : 0} of ${total}`}
            </span>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
              <button
                type="button"
                className="pager-btn"
                disabled={page<=1}
                onClick={()=> setPage(p=> Math.max(1, p-1))}
                aria-label="Previous page"
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ minWidth:32, textAlign:'center', fontSize:12 }}>{page}/{pageCount}</span>
              <button
                type="button"
                className="pager-btn"
                disabled={page>=pageCount}
                onClick={()=> setPage(p=> Math.min(pageCount, p+1))}
                aria-label="Next page"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        }
      >
        <div style={{ overflowX:'auto' }}>
          <table className="inbound-table pick-table">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Order</th>
                <th className="px-4 py-2 text-left">Tote(s)</th>
                <th className="px-4 py-2 text-left">SKUs</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Picker</th>
                <th className="px-4 py-2 text-left">Utilization</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6"><LoadingOverlay label="Loading pick orders" /></td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6">
                    <EmptyState icon={<ListChecks />} title="No active orders" message="New pick tasks will appear here." />
                  </td>
                </tr>
              ) : null}
              {paged.map(r => {
                const multi = r.tote_ids.length > 1;
                return (
                  <tr key={r.order_id}>
                    <td className="px-4 py-2" style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{r.order_id}</td>
                    <td className="px-4 py-2">
                      <TotesCell ids={r.tote_ids} multi={multi} />
                    </td>
                    <td className="px-4 py-2">{r.sku_count}</td>
                    <td className="px-4 py-2" style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <MapPin size={14}/> {r.location}
                    </td>
                    <td className="px-4 py-2">
                        <span className="chip" style={{ background: r.priority==='High' ? 'var(--util-high-bg)' : r.priority==='Medium' ? 'var(--util-med-bg)' : 'var(--util-low-bg)', border:'1px solid var(--color-border)' }}>{r.priority}</span>
                    </td>
                    <td className="px-4 py-2">
                      {r.picker ? (
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><User size={14}/> {r.picker}</span>
                      ) : <span style={{ color:'var(--color-text-muted)' }}>Unassigned</span>}
                    </td>
                    <td className="px-4 py-2" style={{ minWidth: 160 }}>
                      <UtilizationBar value={r.utilizationPct} />
                    </td>
                    <td className="px-4 py-2">
                      <div style={{ display:'inline-flex', gap:10, whiteSpace:'nowrap' }}>
                        {r.status === 'Pending' && (
                          <button className="action-link primary" onClick={()=> onStartPicking(r.order_id)}><Play size={16}/> Start</button>
                        )}
                        {r.status === 'InProgress' && (
                          <>
                            <button className="action-link muted" onClick={()=> onPausePicking(r.order_id)}><Pause size={16}/> Pause</button>
                            <button className="action-link danger" onClick={()=> onStopPicking(r.order_id)}><StopCircle size={16}/> Stop</button>
                          </>
                        )}
                        <button className="action-link success" onClick={()=> openCompleteModal(r)}><CheckCircle size={16}/> Complete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
  </TableCard>

      {completeFor && (
        <div className="inbound-modal-overlay" onClick={()=> setCompleteFor(null)}>
          <div className="inbound-modal" onClick={e=>e.stopPropagation()} style={{maxWidth: 760}}>
            <div className="inbound-modal-header">
              <h2 className="inbound-modal-title">Complete Picking: {completeFor.order_id}</h2>
              <button className="btn-outline-token" onClick={()=> setCompleteFor(null)}>Close</button>
            </div>
            <div className="inbound-modal-body" style={{gap:12}}>
              <table className="inbound-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Item</th>
                    <th>Planned</th>
                    <th>Picked</th>
                  </tr>
                </thead>
                <tbody>
                  {completeLines.map((l, idx) => (
                    <tr key={l.sku}>
                      <td style={{fontFamily:'ui-monospace, Menlo, monospace'}}>{l.sku}</td>
                      <td>{l.name}</td>
                      <td>{l.planned}</td>
                      <td>
                        <input
                          className="line-input"
                          type="number"
                          min={0}
                          style={{width:80}}
                          value={l.picked}
                          onChange={e=>{
                            const val = Math.max(0, Number(e.target.value||0));
                            setCompleteLines(prev => prev.map((x,i)=> i===idx ? { ...x, picked: val } : x));
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="empty-hint" style={{marginTop:8}}>Please confirm picked quantities match planned for accuracy.</div>
            </div>
            <div className="inbound-modal-footer" style={{justifyContent:'space-between'}}>
              <div />
              <div style={{display:'flex', gap:8}}>
                <button className="btn-outline-token" onClick={()=> setCompleteFor(null)}>Cancel</button>
                <button className="btn-primary-token" onClick={confirmComplete}>Confirm Complete</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {shortsConfirm && (
        <div className="inbound-modal-overlay" onClick={()=> setShortsConfirm(false)}>
          <div className="inbound-modal" onClick={e=>e.stopPropagation()} style={{maxWidth: 520}}>
            <div className="inbound-modal-header">
              <h2 className="inbound-modal-title">Complete with shorts?</h2>
              <button className="btn-outline-token" onClick={()=> setShortsConfirm(false)}>Close</button>
            </div>
            <div className="inbound-modal-body">
              <p>Some product lines have picked quantity less than planned. Do you want to proceed and mark the order as completed?</p>
            </div>
            <div className="inbound-modal-footer" style={{justifyContent:'space-between'}}>
              <div />
              <div style={{display:'flex', gap:8}}>
                <button className="btn-outline-token" onClick={()=> setShortsConfirm(false)}>Cancel</button>
                <button className="btn-primary-token" onClick={proceedCompleteWithShorts}>Proceed</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickList;
