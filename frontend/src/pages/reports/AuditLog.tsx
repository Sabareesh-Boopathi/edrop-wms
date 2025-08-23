import React from 'react';
import { getSystemAudit, AuditLogItem } from '../../services/auditService';
// actor_name and actor_role now come from backend; no users cross-reference needed
import { useConfig } from '../../contexts/ConfigContext';
import EmptyState from '../../components/EmptyState';
import TableCard from '../../components/table/TableCard';
import { Filter as FilterIcon, Search as SearchIcon, Cog, RefreshCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import * as notify from '../../lib/notify';
import { useAuth } from '../../contexts/AuthContext';
import LoadingOverlay from '../../components/LoadingOverlay';

const ENTITY_BADGE: Record<string, string> = {
  system_config: 'badge badge--system',
  warehouse_config: 'badge badge--warehouse',
};

const PAGE_SIZE = 25;

const AuditLog: React.FC = () => {
  const [items, setItems] = React.useState<AuditLogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [limit, setLimit] = React.useState(100);
  const [q, setQ] = React.useState('');
  const [sortKey, setSortKey] = React.useState<'created_at' | 'actor' | 'role' | 'entity_type' | 'action'>('created_at');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [actionFilter, setActionFilter] = React.useState<string>('all');
  const [entityFilter, setEntityFilter] = React.useState<string>('all');
  const [actorFilter, setActorFilter] = React.useState<string>('all');
  const [dateFilter, setDateFilter] = React.useState<string>('');
  const [page, setPage] = React.useState(1);
  const { formatDateTime } = useConfig();
  const { user } = useAuth();
  const role = user?.role;
  const managerWarehouseId = (role === 'MANAGER') ? (user?.warehouse_id ?? (typeof window !== 'undefined' ? localStorage.getItem('AUTH_USER_WAREHOUSE_ID') : '') ?? '') as string : '';

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSystemAudit(limit);
      // If MANAGER, scope client-side to their warehouse and common entities
      if (role === 'MANAGER' && managerWarehouseId) {
        const scoped = data.filter((it) => {
          // include system-level configs
          if (it.entity_type === 'system_config') return true;
          // include vendor/store/products (common once per user request)
          if (['vendor','store','product','products','stores','vendors'].includes(it.entity_type)) return true;
          // include warehouse_config for their warehouse only
          if (it.entity_type === 'warehouse_config') {
            return String(it.entity_id || '') === String(managerWarehouseId);
          }
          // otherwise exclude
          return false;
        });
        setItems(scoped);
      } else {
        setItems(data);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [limit, role, managerWarehouseId]);

  React.useEffect(() => { load(); }, [load]);

  // Map userId to name for fast lookup
  const getActorName = (it: AuditLogItem) => it.actor_name || it.actor_user_id;
  const getActorRole = (it: AuditLogItem) => (it.actor_role || '').toUpperCase();

  const filtered = React.useMemo(() => {
    let arr = items;
    if (actionFilter !== 'all') arr = arr.filter(it => it.action === actionFilter);
    if (entityFilter !== 'all') arr = arr.filter(it => it.entity_type === entityFilter);
  if (actorFilter !== 'all') arr = arr.filter(it => (it.actor_name || it.actor_user_id) === actorFilter);
    if (dateFilter) {
      // dateFilter is in 'YYYY-MM-DDTHH:mm' format
      const filterDate = new Date(dateFilter);
      arr = arr.filter(it => {
        const d = new Date(it.created_at);
        // Fetch records >= selected datetime
        return d.getTime() >= filterDate.getTime();
      });
    }
    if (q.trim()) {
      const term = q.toLowerCase();
      arr = arr.filter((it) => {
  const base = `${getActorName(it)} ${getActorRole(it)} ${it.entity_type} ${it.entity_id || ''} ${it.action}`.toLowerCase();
        const changeStr = Object.entries(it.changes || {})
          .map(([k, v]) => `${k}:${JSON.stringify((v as any).before)}>${JSON.stringify((v as any).after)}`)
          .join(' ')
          .toLowerCase();
        return base.includes(term) || changeStr.includes(term);
      });
    }
    const sorted = [...arr].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'created_at') {
        av = new Date(a.created_at).getTime();
        bv = new Date(b.created_at).getTime();
      } else if (sortKey === 'actor') {
        av = getActorName(a);
        bv = getActorName(b);
      } else if (sortKey === 'role') {
        av = getActorRole(a);
        bv = getActorRole(b);
      } else if (sortKey === 'entity_type') {
        av = a.entity_type || '';
        bv = b.entity_type || '';
      } else if (sortKey === 'action') {
        av = a.action || '';
        bv = b.action || '';
      }
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * (sortDir === 'asc' ? 1 : -1);
      return String(av).localeCompare(String(bv)) * (sortDir === 'asc' ? 1 : -1);
    });
    return sorted;
  }, [items, q, sortKey, sortDir, actionFilter, entityFilter, actorFilter, dateFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = React.useMemo(() => {
    const s = (page - 1) * PAGE_SIZE;
    return filtered.slice(s, s + PAGE_SIZE);
  }, [filtered, page]);
  React.useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  const exportCsv = React.useCallback(() => {
    const header = ['when','actor_user_id','entity_type','entity_id','action','field','before','after'];
    const rows: string[][] = [];
    filtered.forEach((it) => {
      const actorName = getActorName(it);
      const base = [formatDateTime(it.created_at), actorName, it.entity_type, it.entity_id || '', it.action];
      const changes = Object.entries(it.changes || {});
      if (changes.length === 0) {
        rows.push([...base, '', '', '']);
      } else {
        changes.forEach(([field, val]) => {
          const before = JSON.stringify((val as any).before ?? '');
          const after = JSON.stringify((val as any).after ?? '');
          rows.push([...base, field, before, after]);
        });
      }
    });
    const csv = [header, ...rows]
      .map(r => r.map(v => '"' + String(v).replaceAll('"','""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, formatDateTime]);

  const sortBy = (key: typeof sortKey) => {
    setPage(1);
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  };

  return (
    <div className="page-container inbound-page">
      <TableCard
        variant="inbound"
        title={<div style={{ display:'flex', alignItems:'center', gap:8 }}><Cog size={18}/> Audit Log</div>}
        search={
          <div className="form-field" style={{ maxWidth: 360 }}>
            <label>Search</label>
            <div style={{ position:'relative' }}>
              <SearchIcon size={16} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-subtle)' }}/>
              <input style={{ paddingLeft: 30 }} placeholder="actor, role, entity, field or value…" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(1); }} />
            </div>
          </div>
        }
        filters={
          <>
            <div className="form-field" style={{ minWidth: 160 }}>
              <label>Action</label>
              <select value={actionFilter} onChange={e=>{ setActionFilter(e.target.value); setPage(1); }}>
                <option value="all">All</option>
                <option value="update">Update</option>
              </select>
            </div>
            <div className="form-field" style={{ minWidth: 180 }}>
              <label>Entity</label>
              <select value={entityFilter} onChange={e=>{ setEntityFilter(e.target.value); setPage(1); }}>
                <option value="all">All</option>
                <option value="system_config">System Config</option>
                <option value="warehouse_config">Warehouse Config</option>
              </select>
            </div>
            <div className="form-field" style={{ minWidth: 200 }}>
              <label>Actor</label>
              <input placeholder="Filter by actor" value={actorFilter==='all'?'':actorFilter} onChange={e=>{ setActorFilter(e.target.value || 'all'); setPage(1); }} />
            </div>
            <div className="form-field" style={{ minWidth: 200 }}>
              <label>Since</label>
              <input type="datetime-local" value={dateFilter} onChange={e=>{ setDateFilter(e.target.value); setPage(1); }} />
            </div>
            <div className="form-field" style={{ minWidth: 120 }}>
              <label>Fetch</label>
              <select value={String(limit)} onChange={(e)=> setLimit(parseInt(e.target.value, 10))}>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
              </select>
            </div>
          </>
        }
        actions={
          <div style={{ display:'inline-flex', gap:8 }}>
            <button className="icon-btn" onClick={load} title="Refresh" aria-label="Refresh" disabled={loading}><RefreshCw size={16}/></button>
            <button className="icon-btn" onClick={exportCsv} title="Export CSV" aria-label="Export CSV" disabled={loading}><Download size={16}/></button>
          </div>
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
        {loading && (
          <LoadingOverlay label="Loading logs" />
        )}
        <div style={{ overflowX:'auto' }}>
          <table className="inbound-table">
            <thead>
              <tr>
                <th><button type="button" className="th-sort" onClick={()=> sortBy('created_at')}>When</button></th>
                <th><button type="button" className="th-sort" onClick={()=> sortBy('actor')}>Actor</button></th>
                <th><button type="button" className="th-sort" onClick={()=> sortBy('role')}>Role</button></th>
                <th><button type="button" className="th-sort" onClick={()=> sortBy('entity_type')}>Entity</button></th>
                <th><button type="button" className="th-sort" onClick={()=> sortBy('action')}>Action</button></th>
                <th>Changes</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6">
                    <EmptyState icon={<Cog />} title="No audit entries" message="Change a setting in System Config to generate a log." />
                  </td>
                </tr>
              ) : null}
              {paged.map((it) => (
                <tr key={it.id}>
                  <td className="mono">{formatDateTime(it.created_at)}</td>
                  <td className="mono subtle">{getActorName(it)}</td>
                  <td className="mono subtle">{getActorRole(it) || '-'}</td>
                  <td>
                    <span className={ENTITY_BADGE[it.entity_type] || 'badge'}>
                      {it.entity_type.replace('_', ' ')}
                    </span>
                    {it.entity_id && (
                      <span className="entity-id mono">{it.entity_id}</span>
                    )}
                  </td>
                  <td><span className="chip chip--action">{it.action}</span></td>
                  <td>
                    <ul className="changes-list">
                      {Object.entries(it.changes || {}).map(([field, val]) => (
                        <li key={field}>
                          <span className="field-name">{field}</span>
                          <span className="arrow">→</span>
                          <code className="before-value">{JSON.stringify((val as any).before)}</code>
                          <span className="arrow">→</span>
                          <code className="after-value">{JSON.stringify((val as any).after)}</code>
                        </li>
                      ))}
                    </ul>
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

export default AuditLog;
