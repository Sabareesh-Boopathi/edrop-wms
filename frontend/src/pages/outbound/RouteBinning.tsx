import React, { useEffect, useMemo, useState } from 'react';
import RouteBinsCard from '../../components/outbound/RouteBinsCard';
import EmptyState from '../../components/EmptyState';
import KpiCard from '../../components/KpiCard';
import { MapPinned, RefreshCw, Search, Boxes, Route as RouteIcon } from 'lucide-react';
import '../inbound/Inbound.css';
import * as notify from '../../lib/notify';
import { fetchRoutes, forceBinReassign, toggleRouteLock, reoptimizeRoutes, type RouteSummary } from '../../services/outboundService';
import './outbound.css';

const PAGE_SIZE = 5;

const RouteBinning: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try { setRoutes(await fetchRoutes()); } catch { notify.error('Failed to load routes'); } finally { setLoading(false); }
  }
  useEffect(() => {
    let mounted = true; load();
    const t = window.setInterval(() => { if (mounted) load(); }, 10000);
    return () => { mounted = false; window.clearInterval(t); };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return routes;
    return routes.filter(r => r.name.toLowerCase().includes(term) || r.route_id.toLowerCase().includes(term));
  }, [routes, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => { const s = (page - 1) * PAGE_SIZE; return filtered.slice(s, s + PAGE_SIZE); }, [filtered, page]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  // KPIs
  const totals = routes.reduce((acc, r) => {
    r.bins.forEach(b => { acc.capacity += b.capacity; acc.totes += b.totes.length; });
    return acc;
  }, { capacity: 0, totes: 0 });
  const fillPct = totals.capacity ? Math.round((totals.totes / totals.capacity) * 100) : 0;
  const unassigned = Math.max(0, 0); // if we track pool of unassigned totes later

  const onForceReassign = async (fromBinId: string, toteId: string) => {
    const toBin = window.prompt(`Move ${toteId} to bin id:`);
    if (!toBin) return;
    await forceBinReassign(toteId, toBin);
    notify.success('Tote moved');
    load();
  };
  const onToggleLock = async (routeId: string, lock: boolean) => {
    await toggleRouteLock(routeId, lock);
    notify.info(lock ? 'Route locked' : 'Route unlocked');
    load();
  };
  const onReoptimize = async () => {
    await reoptimizeRoutes();
    notify.info('Re-optimization triggered');
    load();
  };

  return (
    <div className="page-container inbound-page">
      <div className="inbound-header">
        <div>
          <h1>Route Binning</h1>
          <p>Monitor and manage slotting of totes into route bins. Lock routes and override assignments as needed.</p>
        </div>
        <div className="inline-actions">
          <button className="btn-outline-token" onClick={onReoptimize}><RefreshCw size={16}/> Re-optimize</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <KpiCard icon={<Boxes />} title="Fill %" value={`${fillPct}%`} variant="indigo" />
        <KpiCard icon={<RouteIcon />} title="Routes" value={routes.length} variant="slate" />
        <KpiCard icon={<Boxes />} title="Unassigned Totes" value={unassigned} variant="orange" />
      </div>

      {/* Filters / Legend */}
      <div className="inbound-filters" style={{ alignItems:'center' }}>
        <div className="form-field" style={{ maxWidth: 320 }}>
          <label>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 8, top: '50%', transform:'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
            <input style={{ paddingLeft: 30 }} placeholder="Route name / ID" value={q} onChange={(e)=>{setQ(e.target.value); setPage(1);}} />
          </div>
        </div>
        <span className="chip chip-neutral">Auto slotting routes are filled automatically</span>
        <span className="chip" style={{ background:'color-mix(in srgb, var(--color-error) 10%, transparent)', border:'1px solid var(--color-error)', color:'var(--color-error)' }}>Overfilled bin</span>
      </div>

      {/* Content grid */}
      {paged.length === 0 && !loading ? (
        <EmptyState icon={<MapPinned />} title="No active routes" message="Configured routes will appear here." actionLabel="Refresh" onAction={load} actionClassName="btn-outline-token" />
      ) : (
        <div style={{ display:'grid', gap:16 }}>
          {paged.map(r => (
            <RouteBinsCard key={r.route_id} route={r} onForceReassign={onForceReassign} onToggleLock={onToggleLock} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RouteBinning;
