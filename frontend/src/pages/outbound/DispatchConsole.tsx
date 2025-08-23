import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DispatchRouteCard from '../../components/outbound/DispatchRouteCard';
import EmptyState from '../../components/EmptyState';
import KpiCard from '../../components/KpiCard';
import { Truck, Search, Loader2, TriangleAlert } from 'lucide-react';
import '../inbound/Inbound.css';
import './outbound.css';
import * as notify from '../../lib/notify';
import { fetchDispatchRoutes, assignDriver, approveDispatch, type DispatchRoute } from '../../services/outboundService';

const PAGE_SIZE = 6;

const DispatchConsole: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<DispatchRoute[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDispatchRoutes();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      notify.error(e?.message || 'Failed to load dispatch routes');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return routes;
    return routes.filter(r => r.name.toLowerCase().includes(term) || r.route_id.toLowerCase().includes(term));
  }, [routes, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => { const s = (page - 1) * PAGE_SIZE; return filtered.slice(s, s + PAGE_SIZE); }, [filtered, page]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  // KPIs
  const ready = routes.filter(r => r.status === 'ready').length;
  const inProgress = routes.filter(r => r.status === 'waiting' || r.status === 'pending').length;
  const pendingIssues = routes.filter(r => r.totes_loaded < r.totes_expected).length;

  const onAssignDriver = async (routeId: string) => {
    const driver = window.prompt('Driver name');
    if (!driver) return;
    const vehicle = window.prompt('Vehicle (optional)') || undefined;
    try { await assignDriver(routeId, driver, vehicle); notify.success(`Assigned ${driver}`); void load(); }
    catch (e: any) { notify.error(e?.message || 'Failed to assign'); }
  };
  const onDispatch = async (routeId: string) => {
    try { await approveDispatch(routeId); notify.info(`Dispatched ${routeId}`); void load(); }
    catch (e: any) { notify.error(e?.message || 'Failed to dispatch'); }
  };

  return (
    <div className="page-container inbound-page">
      <div className="inbound-header">
        <div>
          <h1>Dispatch Console</h1>
          <p>Track route readiness, assign drivers/vehicles, and dispatch when ready.</p>
        </div>
        <div className="inline-actions">
          {/* Reserved for future bulk actions if any */}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <KpiCard icon={<Truck />} title="Ready" value={ready} variant="emerald" />
        <KpiCard icon={<Loader2 />} title="Loading" value={inProgress} variant="indigo" />
        <KpiCard icon={<TriangleAlert />} title="Issues" value={pendingIssues} variant="orange" />
      </div>

      {/* Filters / Search */}
      <div className="inbound-filters" style={{ alignItems:'center' }}>
        <div className="form-field" style={{ maxWidth: 320 }}>
          <label>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 8, top: '50%', transform:'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
            <input style={{ paddingLeft: 30 }} placeholder="Route name / ID" value={q} onChange={(e)=>{setQ(e.target.value); setPage(1);}} />
          </div>
        </div>
        <span className="chip" style={{ background:'var(--color-primary-soft)', border:'1px solid var(--color-primary-hover)', color:'var(--color-primary)' }}>Ready</span>
        <span className="chip chip-neutral">Loading</span>
        <span className="chip" style={{ background:'color-mix(in srgb, var(--color-error) 8%, transparent)', border:'1px solid var(--color-error)', color:'var(--color-error)' }}>Shortage</span>
      </div>

      {/* Card list */}
      {paged.length === 0 && !loading ? (
        <EmptyState icon={<Truck />} title="No routes to dispatch" message="When routes are ready, they'll show up here." />
      ) : (
        <div style={{ display:'grid', gap:16 }}>
          {paged.map(r => (
            <DispatchRouteCard key={r.route_id} route={r as any} onAssignDriver={onAssignDriver} onDispatch={onDispatch} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DispatchConsole;
