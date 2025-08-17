import React, { useEffect, useMemo, useState } from 'react';
import TableCard from '../../components/table/TableCard';
import EmptyState from '../../components/EmptyState';
import { ChevronLeft, ChevronRight, PackageSearch, ListChecks, Trash2, MapPin, RefreshCw, AlertTriangle, Search, CheckCircle } from 'lucide-react';
import KpiCard from '../../components/KpiCard';
import '../inbound/Inbound.css';
import * as notify from '../../lib/notify';
import {
  fetchPickTasks,
  fetchToteLocation,
  reassignPickTask,
  cancelPickTask,
  splitPickTask,
  type PickTask,
  type ToteLocation,
} from '../../services/outboundService';
import './outbound.css';

const PAGE_SIZE = 10;

const statusColor: Record<string, string> = {
  pending: 'var(--color-text-muted)',
  in_progress: 'var(--color-primary)',
  completed: 'var(--color-success)',
  exception: 'var(--color-error)'
};

const PickList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<PickTask[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [locByTote, setLocByTote] = useState<Record<string, ToteLocation | 'loading'>>({});

  async function load() {
    setLoading(true);
    try {
      const data = await fetchPickTasks();
      setTasks(data);
    } catch {
      notify.error('Failed to load pick tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    load();
    const t = window.setInterval(() => { if (mounted) load(); }, 10000); // 10s poll
    return () => { mounted = false; window.clearInterval(t); };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter(t => (
      t.tote_id.toLowerCase().includes(term) ||
      t.order_id.toLowerCase().includes(term) ||
      (t.picker || '').toLowerCase().includes(term) ||
      t.status.toLowerCase().includes(term)
    ));
  }, [tasks, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  // Metrics
  const totalSkus = tasks.reduce((sum, t) => sum + (t.sku_count || 0), 0);
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  // Simple efficiency heuristic
  const efficiency = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const locateTote = async (toteId: string) => {
    if (locByTote[toteId] === 'loading') return;
    setLocByTote(prev => ({ ...prev, [toteId]: 'loading' }));
    const loc = await fetchToteLocation(toteId);
    setLocByTote(prev => ({ ...prev, [toteId]: loc }));
  };

  const onReassign = async (taskId: string) => {
    const picker = window.prompt('Reassign to picker (name/email):');
    if (!picker) return;
    await reassignPickTask(taskId, picker);
    notify.success('Task reassigned');
    load();
  };
  const onCancel = async (taskId: string) => {
    if (!window.confirm('Cancel this pick task?')) return;
    await cancelPickTask(taskId);
    notify.info('Task canceled');
    load();
  };
  const onSplit = async (taskId: string) => {
    const input = window.prompt('Split between pickers (comma separated):');
    if (!input) return;
    const pickers = input.split(',').map(s => s.trim()).filter(Boolean);
    if (!pickers.length) return;
    await splitPickTask(taskId, pickers);
    notify.success('Task split');
    load();
  };

  return (
    <div className="page-container">
      <div className="inbound-header">
        <div>
          <h1>Pick List</h1>
          <p>Manage pick tasks, monitor progress, and handle exceptions.</p>
        </div>
        <div className="inline-actions">
          <button className="btn-outline-token" onClick={load} title={loading ? 'Refreshing…' : 'Refresh'} disabled={loading}>
            <RefreshCw size={16}/> Refresh
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <KpiCard icon={<ListChecks />} title="Total Tasks" value={tasks.length} variant="slate" caption={`Efficiency ${efficiency}%`} />
        <KpiCard icon={<RefreshCw />} title="In Progress" value={inProgress} variant="indigo" />
        <KpiCard icon={<CheckCircle />} title="Completed" value={completed} variant="emerald" />
      </div>
      <TableCard
        variant="inbound"
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ListChecks size={18}/> Pick List Console</div>}
        search={
          <div className="form-field" style={{ maxWidth: 340 }}>
            <label>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 8, top: '50%', transform:'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
              <input style={{ paddingLeft: 30 }} placeholder="Tote / Order / Picker / Status" value={q} onChange={(e)=>{setQ(e.target.value); setPage(1);}} />
            </div>
          </div>
        }
        actions={<button className="btn-outline-token" onClick={load}><RefreshCw size={16}/> Refresh</button>}
        filters={
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div className="chip" style={{ background:'var(--color-surface-alt)', border:'1px solid var(--color-border)' }}>Total SKUs: <strong>{totalSkus}</strong></div>
            <div className="chip" style={{ background:'var(--util-high-bg)', border:'1px solid var(--util-high-border)', color:'var(--util-high-text)' }}>In Progress: <strong>{inProgress}</strong></div>
            <div className="chip" style={{ background:'var(--color-primary-soft)', border:'1px solid var(--color-primary-hover)', color:'var(--color-primary)' }}>Pending: <strong>{pending}</strong></div>
            <div className="chip" style={{ background:'color-mix(in srgb, var(--color-success) 12%, transparent)', border:'1px solid var(--color-success)', color:'var(--color-success)' }}>Completed: <strong>{completed}</strong></div>
            <div className="chip" style={{ background:'var(--color-surface-alt)', border:'1px solid var(--color-border)' }}>Efficiency: <strong>{efficiency}%</strong></div>
          </div>
        }
        footer={
          <>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{loading ? 'Loading…' : `Total tasks: ${filtered.length}`}</span>
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
                <th className="px-4 py-2 text-left">SKUs</th>
                <th className="px-4 py-2 text-left">Picker</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Exceptions</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6">
                    <EmptyState
                      icon={<PackageSearch />}
                      title="No active pick tasks"
                      message="New orders will appear here as pick tasks are created."
                      actionLabel="Refresh"
                      onAction={load}
                      actionClassName="btn-outline-token"
                    />
                  </td>
                </tr>
              ) : null}
              {paged.map(t => {
                const loc = locByTote[t.tote_id];
                return (
                  <tr key={t.id}>
                    <td className="px-4 py-2" style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{t.tote_id}</span>
                      <button className="icon-btn-plain" title="Locate tote" onClick={() => locateTote(t.tote_id)}>
                        <MapPin size={16} />
                      </button>
                      {loc && loc !== 'loading' ? (
                        <span className="chip" style={{ background:'var(--color-surface-alt)', border:'1px solid var(--color-border)', fontWeight:600 }}>
                          {loc.location.replace('_',' ')}
                        </span>
                      ) : loc === 'loading' ? (
                        <span style={{ fontSize:12, color:'var(--color-text-muted)' }}>Locating…</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2" style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{t.order_id}</td>
                    <td className="px-4 py-2">{t.sku_count}</td>
                    <td className="px-4 py-2">{t.picker || <span style={{ color:'var(--color-text-muted)' }}>—</span>}</td>
                    <td className="px-4 py-2">
                      <span className="chip" style={{ background:'var(--color-surface-alt)', border:'1px solid var(--color-border)', color: statusColor[t.status] || 'inherit', textTransform:'capitalize' }}>{t.status.replace('_',' ')}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div style={{ display:'inline-flex', gap:6, flexWrap:'wrap' }}>
                        {(t.exceptions || []).map((ex, i) => (
                          <span key={i} className="chip" style={{ background:'color-mix(in srgb, var(--color-error) 10%, transparent)', border:'1px solid var(--color-error)', color:'var(--color-error)' }}>
                            <AlertTriangle size={12}/> {ex.replace('_',' ')}
                          </span>
                        ))}
                        {(!t.exceptions || t.exceptions.length === 0) ? <span style={{ color:'var(--color-text-muted)', fontSize:12 }}>None</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div style={{ display:'inline-flex', gap:10 }}>
                        <button type="button" className="action-link primary" onClick={() => onReassign(t.id)}>
                          Reassign
                        </button>
                        <button type="button" className="action-link primary" onClick={() => onSplit(t.id)}>
                          Split Task
                        </button>
                        <button type="button" className="action-link danger" onClick={() => onCancel(t.id)}>
                          <Trash2 size={16}/> Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  );
};

export default PickList;
