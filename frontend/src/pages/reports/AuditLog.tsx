import React from 'react';
import { getSystemAudit, AuditLogItem } from '../../services/auditService';
import { getUsers } from '../../services/userService';
import { UserData, UserSchema } from '../administration/UsersAndRoles';
import { useConfig } from '../../contexts/ConfigContext';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import { Filter as FilterIcon, Search as SearchIcon, Cog } from 'lucide-react';
import * as notify from '../../lib/notify';
import '../administration/WarehouseManagement.css';
import './AuditLog.css';

const ENTITY_BADGE: Record<string, string> = {
  system_config: 'badge badge--system',
  warehouse_config: 'badge badge--warehouse',
};

const AuditLog: React.FC = () => {
  const [items, setItems] = React.useState<AuditLogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [limit, setLimit] = React.useState(100);
  const [q, setQ] = React.useState('');
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [sortBy, setSortBy] = React.useState<'date' | 'actor'>('date');
  const [actionFilter, setActionFilter] = React.useState<string>('all');
  const [entityFilter, setEntityFilter] = React.useState<string>('all');
  const [actorFilter, setActorFilter] = React.useState<string>('all');
  const [dateFilter, setDateFilter] = React.useState<string>('');
  const { formatDateTime } = useConfig();

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSystemAudit(limit);
      setItems(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    load();
    getUsers().then(setUsers).catch(() => {
      notify.error('Failed to fetch users');
    });
  }, [load]);

  // Map userId to name for fast lookup
  const userMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => { map[u.id] = u.name; });
    return map;
  }, [users]);

  const filtered = React.useMemo(() => {
    let arr = items;
    if (actionFilter !== 'all') arr = arr.filter(it => it.action === actionFilter);
    if (entityFilter !== 'all') arr = arr.filter(it => it.entity_type === entityFilter);
    if (actorFilter !== 'all') arr = arr.filter(it => it.actor_user_id === actorFilter);
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
        const base = `${userMap[it.actor_user_id] || it.actor_user_id} ${it.entity_type} ${it.entity_id || ''} ${it.action}`.toLowerCase();
        const changeStr = Object.entries(it.changes || {})
          .map(([k, v]) => `${k}:${JSON.stringify((v as any).before)}>${JSON.stringify((v as any).after)}`)
          .join(' ')
          .toLowerCase();
        return base.includes(term) || changeStr.includes(term);
      });
    }
    if (sortBy === 'actor') {
      arr = [...arr].sort((a, b) => (userMap[a.actor_user_id] || '').localeCompare(userMap[b.actor_user_id] || ''));
    } else {
      arr = [...arr].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return arr;
  }, [items, q, userMap, sortBy, actionFilter, entityFilter, actorFilter, dateFilter]);

  const exportCsv = React.useCallback(() => {
    const header = ['when','actor_user_id','entity_type','entity_id','action','field','before','after'];
    const rows: string[][] = [];
    filtered.forEach((it) => {
      const base = [formatDateTime(it.created_at), it.actor_user_id, it.entity_type, it.entity_id || '', it.action];
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

  return (
    <div className="page-content">
      {/* Header styled like WarehouseManagement */}
      <header className="header">
        <div className="header-text">
          <h1>Audit Log</h1>
          <p>Recent configuration changes with field-level diffs.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline-token" onClick={exportCsv} disabled={loading}>Export CSV</button>
          <button className="btn-primary-token" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </header>
      {/* Filters bar below title */}
      <div className="filters-bar" style={{ marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 16, color: 'var(--color-text-soft)' }}>
          <FilterIcon size={18} style={{ marginRight: 2, color: 'var(--color-text-subtle)' }} /> Filters
        </div>
        <div className="filter-item select">
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="all">All Actions</option>
            <option value="update">Update</option>
            {/* Add more actions here if needed */}
          </select>
        </div>
        <div className="filter-item select">
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
            <option value="all">All Entities</option>
            <option value="system_config">System Config</option>
            <option value="warehouse_config">Warehouse Config</option>
          </select>
        </div>
        <div className="filter-item select">
          <select value={actorFilter} onChange={e => setActorFilter(e.target.value)}>
            <option value="all">All Actors</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-item input">
          <input
            type="datetime-local"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ minWidth: 180 }}
          />
        </div>
        <div className="filter-item select">
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="date">Sort: Date</option>
            <option value="actor">Sort: Actor</option>
          </select>
        </div>
      </div>
      <div className="card">
        {/* Card header: left-aligned search label and bar, right-aligned show filter */}
        <div className="card-header audit-header" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 500, fontSize: 15, marginRight: 8 }}>Search</span>
            <div style={{ position: 'relative', width: 220, maxWidth: '100%' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }}>
                <SearchIcon size={15} />
              </span>
              <input
                className="search-input"
                placeholder="actor, entity, field or value…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ width: '100%', paddingLeft: 30 }}
              />
            </div>
          </div>
          <div className="input-group" style={{ marginLeft: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="limit">Show</label>
            <select
              id="limit"
              className="count-select"
              value={String(limit)}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
              <option value="500">500</option>
            </select>
          </div>
        </div>
        <div className="card-content">
          {loading && (
            <div className="skeleton-table" aria-busy>
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert" style={{ marginBottom: 8 }}>
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Actor</th>
                    <th>Entity</th>
                    <th>Action</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-cell">
                        <EmptyState
                          icon={<Cog size={40} strokeWidth={1.5} style={{ color: 'var(--color-text-subtle)' }} />}
                          title="No audit entries"
                          message="Tip: Change a setting in System Config to generate a log."
                          actionLabel="Go to System Config"
                          onAction={() => window.location.href = '/administration/system-configuration'}
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map((it) => (
                      <tr key={it.id}>
                        <td className="mono">{formatDateTime(it.created_at)}</td>
                        <td className="mono subtle">{userMap[it.actor_user_id] || <span title={it.actor_user_id}>{it.actor_user_id}</span>}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
