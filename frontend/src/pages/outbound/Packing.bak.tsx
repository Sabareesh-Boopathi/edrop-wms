import React, { useEffect, useMemo, useState } from 'react';
import TableCard from '../../components/table/TableCard';
import EmptyState from '../../components/EmptyState';
import { ChevronLeft, ChevronRight, PackageOpen, RefreshCw, AlertTriangle, ClipboardList, CheckCircle, ArrowLeftCircle, Shuffle, Search } from 'lucide-react';
import KpiCard from '../../components/KpiCard';
import '../inbound/Inbound.css';
import * as notify from '../../lib/notify';
import { fetchPackingQueue, sendBackToPicking, reassignToteToOrder, overrideValidation, type PackingTote } from '../../services/outboundService';
import './outbound.css';

const PAGE_SIZE = 10;

const statusColor: Record<string, string> = {
  waiting: 'var(--color-text-muted)',
  scanning: 'var(--color-primary)',
  pass: 'var(--color-success)',
  mismatch: 'var(--color-error)'
};

const Packing: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<PackingTote[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try { setQueue(await fetchPackingQueue()); } catch { notify.error('Failed to load packing queue'); } finally { setLoading(false); }
  }

  useEffect(() => {
    let mounted = true;
    load();
    const t = window.setInterval(() => { if (mounted) load(); }, 10000);
    return () => { mounted = false; window.clearInterval(t); };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return queue;
    return queue.filter(t => t.tote_id.toLowerCase().includes(term) || t.order_id.toLowerCase().includes(term) || t.status.toLowerCase().includes(term));
  }, [queue, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => { const s = (page - 1) * PAGE_SIZE; return filtered.slice(s, s + PAGE_SIZE); }, [filtered, page]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  // Metrics
  const mismatches = queue.filter(t => t.status === 'mismatch').length;
  const waiting = queue.filter(t => t.status === 'waiting').length;
  const scanning = queue.filter(t => t.status === 'scanning').length;
  const passed = queue.filter(t => t.status === 'pass').length;
  const avgValidationMs = (() => {
    const times = queue.map(t => {
      if (!t.arrived_at || !t.scan_logs?.length) return 0;
      const start = new Date(t.arrived_at).getTime();
      const end = new Date(t.scan_logs[t.scan_logs.length - 1].ts).getTime();
      return Math.max(end - start, 0);
    }).filter(Boolean);
    if (!times.length) return 0;
    return Math.round(times.reduce((a,b)=>a+b,0) / times.length);
  })();
  const avgValidationMin = Math.round(avgValidationMs / 600) / 10; // one decimal
  const errorRate = queue.length ? Math.round((mismatches / queue.length) * 100) : 0;

  // KPIs computed above
  const viewLogs = (tote: PackingTote) => {
    if (!tote.scan_logs?.length) { notify.info('No scan logs'); return; }
    const text = tote.scan_logs.map(l => `${l.ts} • ${l.code} • ${l.ok ? 'OK' : 'FAIL'}${l.note ? ' • ' + l.note : ''}`).join('\n');
    alert(`Scan logs for ${tote.tote_id}:\n\n${text}`);
  };

  const onSendBack = async (toteId: string) => {
    if (!window.confirm('Send tote back to picking?')) return;
    await sendBackToPicking(toteId);
    notify.info('Sent back to picking');
    load();
  };
  const onReassignOrder = async (toteId: string) => {
    const orderId = window.prompt('Reassign to Order ID:');
    if (!orderId) return;
    await reassignToteToOrder(toteId, orderId);
    notify.success('Tote reassigned');
    load();
  };
  const onOverride = async (toteId: string) => {
    const note = window.prompt('Override reason/justification:');
    if (!note) return;
    await overrideValidation(toteId, note);
    notify.success('Validation overridden');
    load();
  };

  return (
    <div className="page-container">
      <div className="inbound-header">
        <div>
          <h1>Packing</h1>
          <p>Validate totes, handle mismatches, and complete packing.</p>
        </div>
        <div className="inline-actions">
          <button className="btn-outline-token" onClick={load} title={loading ? 'Refreshing…' : 'Refresh'} disabled={loading}>
            <RefreshCw size={16}/> Refresh
          </button>
        </div>
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
        search={
          <div className="form-field" style={{ maxWidth: 340 }}>
            <label>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 8, top: '50%', transform:'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
              <input style={{ paddingLeft: 30 }} placeholder="Tote / Order / Status" value={q} onChange={(e)=>{setQ(e.target.value); setPage(1);}} />
            </div>
          </div>
        }
        actions={<button className="btn-outline-token" onClick={load}><RefreshCw size={16}/> Refresh</button>}
        filters={
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div className="chip" style={{ background:'var(--color-surface-alt)', border:'1px solid var(--color-border)' }}>Avg Validation: <strong>{avgValidationMin}m</strong></div>
            <div className="chip" style={{ background:'color-mix(in srgb, var(--color-error) 10%, transparent)', border:'1px solid var(--color-error)', color:'var(--color-error)' }}>Error Rate: <strong>{errorRate}%</strong></div>
            <div className="chip" style={{ background:'var(--color-primary-soft)', border:'1px solid var(--color-primary-hover)', color:'var(--color-primary)' }}>Waiting: <strong>{waiting}</strong></div>
            <div className="chip" style={{ background:'var(--util-high-bg)', border:'1px solid var(--util-high-border)', color:'var(--util-high-text)' }}>Scanning: <strong>{scanning}</strong></div>
            <div className="chip" style={{ background:'color-mix(in srgb, var(--color-success) 12%, transparent)', border:'1px solid var(--color-success)', color:'var(--color-success)' }}>Pass: <strong>{passed}</strong></div>
            <div className="chip" style={{ background:'color-mix(in srgb, var(--color-error) 10%, transparent)', border:'1px solid var(--color-error)', color:'var(--color-error)' }}>Mismatch: <strong>{mismatches}</strong></div>
          </div>
        }
        footer={
          <>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{loading ? 'Loading…' : `Total totes: ${filtered.length}`}</span>
            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                className="btn-outline-token"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
                title="Previous"
                style={{ width: 'var(--control-height-sm)', height: 'var(--control-height-sm)', padding: 0, display: 'grid', placeItems: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ minWidth: 32, textAlign: 'center', fontSize: 12 }}>Page {page} / {pageCount}</span>
              <button
                type="button"
                className="btn-outline-token"
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
                aria-label="Next page"
                title="Next"
                style={{ width: 'var(--control-height-sm)', height: 'var(--control-height-sm)', padding: 0, display: 'grid', placeItems: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="inbound-table">
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
              {paged.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6">
                    <EmptyState
                      icon={<ClipboardList />}
                      title="No totes in validation"
                      message="Validated or incoming totes will appear here."
                      actionLabel="Refresh"
                      onAction={load}
                      actionClassName="btn-outline-token"
                    />
                  </td>
                </tr>
              ) : null}
              {paged.map(t => (
                <tr key={t.tote_id}>
                  <td className="px-4 py-2" style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{t.tote_id}</td>
                  <td className="px-4 py-2" style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{t.order_id}</td>
                  <td className="px-4 py-2">{new Date(t.arrived_at).toLocaleTimeString()}</td>
                  <td className="px-4 py-2">
                    <span className="chip" style={{ background:'var(--color-surface-alt)', border:'1px solid var(--color-border)', color: statusColor[t.status] || 'inherit', textTransform:'capitalize' }}>{t.status}</span>
                    {t.status === 'mismatch' ? (
                      <span className="chip" style={{ marginLeft:8, background:'color-mix(in srgb, var(--color-error) 10%, transparent)', border:'1px solid var(--color-error)', color:'var(--color-error)' }}><AlertTriangle size={12}/> Alert</span>
                    ) : t.status === 'pass' ? (
                      <span className="chip" style={{ marginLeft:8, background:'color-mix(in srgb, var(--color-success) 12%, transparent)', border:'1px solid var(--color-success)', color:'var(--color-success)' }}><CheckCircle size={12}/> OK</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    <button type="button" className="action-link primary" onClick={() => viewLogs(t)}>
                      View logs ({t.scan_logs?.length || 0})
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <div style={{ display:'inline-flex', gap:10 }}>
                      <button type="button" className="action-link primary" onClick={() => onReassignOrder(t.tote_id)}><Shuffle size={16}/> Reassign Order</button>
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
    </div>
  );
};

export default Packing;
