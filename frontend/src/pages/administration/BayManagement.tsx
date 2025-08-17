import React, { useEffect, useMemo, useState } from 'react';
import { useBays } from '../../hooks/useBays';
import KpiCard from '../../components/KpiCard';
import EmptyState from '../../components/EmptyState';
import { Bay } from '../../types/bay';
import { assignBay, createBay, deleteBay, releaseBay, switchDynamicType, toggleMaintenance, updateBay } from '../../services/bayService';
import { Truck, Wrench, Square, SquareDot, ActivitySquare, Clock, Percent, Edit, Trash, Search } from 'lucide-react';
import '../inbound/Inbound.css';
import TableCard from '../../components/table/TableCard';
import './BayManagement.css';
import { getWarehouses } from '../../services/warehouseService';
import { Warehouse } from 'types';
import BayFormModal from '../../components/BayFormModal';
import * as notify from '../../lib/notify';

const BayManagement: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh] = useState<string>('');
  const { bays, kpis, loading, error, reload } = useBays(selectedWh || undefined);
  const [query, setQuery] = useState('');
  const [scale, setScale] = useState<'sm'|'md'|'lg'>('md');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Bay | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await getWarehouses();
        setWarehouses(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length) setSelectedWh(list[0].id);
      } catch { /* ignore for now */ }
    })();
  }, []);

  const filtered = useMemo(() => bays.filter(b => (
    (!selectedWh || b.warehouse_id === selectedWh) &&
    (b.id.toLowerCase().includes(query.toLowerCase()) || b.name.toLowerCase().includes(query.toLowerCase()))
  )), [bays, query, selectedWh]);

  const goodsIn = filtered.filter(b => b.type === 'GOODS_IN' || (b.type === 'DYNAMIC' && b.dynamicMode === 'GOODS_IN'));
  const goodsOut = filtered.filter(b => b.type === 'GOODS_OUT' || (b.type === 'DYNAMIC' && b.dynamicMode === 'GOODS_OUT'));
  const parking = filtered.filter(b => b.type === 'PARKING');

  return (
    <div className="inbound-page">
    <div className="inbound-header">
        <div>
          <h1>Bay Management</h1>
          <p>Define, monitor, and control goods-in/out bays.</p>
        </div>
        <div className="inline-actions">
      <button className="btn-outline-token" onClick={reload}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      <button className="btn-primary-token" onClick={() => { setEditing(null); setModalOpen(true); }}>New Bay</button>
        </div>
      </div>

      <div className="inbound-kpis">
        {kpis ? (
          <>
            <KpiCard icon={<ActivitySquare className="icon" />} title="Total Bays" value={kpis.total} variant="slate" />
            <KpiCard icon={<Truck className="icon" />} title="Occupied" value={kpis.occupied} variant="indigo" />
            <KpiCard icon={<SquareDot className="icon" />} title="Reserved" value={kpis.reserved} variant="cyan" />
            <KpiCard icon={<Wrench className="icon" />} title="Maintenance" value={kpis.maintenance} variant="orange" />
            <KpiCard icon={<Square className="icon" />} title="Empty" value={kpis.empty} variant="emerald" />
            <KpiCard icon={<Percent className="icon" />} title="Avg Utilization" value={`${kpis.utilization}%`} variant="pink" />
            <KpiCard icon={<Clock className="icon" />} title="Avg Turnaround" value={`${kpis.averageTurnaroundMin}m`} variant="indigo" />
          </>
        ) : (
          <div className="empty-hint">Loading KPIs…</div>
        )}
      </div>

      <TableCard
        variant="inbound"
        title={<>
          Bays {loading && <span style={{fontSize:12, marginLeft:8}}>Loading…</span>} {error && <span style={{color:'var(--color-error)', marginLeft:8}}>{error}</span>}
        </>}
        warehouse={
          <div className="form-field" style={{minWidth:220}}>
            <label>Warehouse</label>
            <select value={selectedWh} onChange={e=>setSelectedWh(e.target.value)}>
              {warehouses.map(w => <option key={w.id} value={String(w.id)}>{String(w.name)}</option>)}
            </select>
          </div>
        }
        search={
          <div className="form-field" style={{maxWidth:260}}>
            <label>Search</label>
            <div className="input-with-icon">
              <Search size={16} />
              <input placeholder="ID / Name" value={query} onChange={e=>setQuery(e.target.value)} />
            </div>
          </div>
        }
        actions={
          <div className="inline-actions" style={{gap:6}}>
            <div className="pill-group" aria-label="Size">
              {(['sm','md','lg'] as const).map(s => (
                <button key={s} className={`pill ${scale===s?'active':''}`} onClick={()=>setScale(s)} type="button">{s.toUpperCase()}</button>
              ))}
            </div>
          </div>
        }
      >
          {filtered.length === 0 ? (
            <EmptyState title="No Bays" message="Create a bay to get started." actionLabel="New Bay" onAction={()=>{ setEditing(null); setModalOpen(true); }} />
          ) : (
            <>
              <div className="bay-board">
                <div className="bay-lane">
                  <div className="bay-lane-header">
                    <div>
                      <div className="bay-lane-title">Goods In</div>
                      <div className="bay-lane-subtitle">Inbound docks</div>
                    </div>
                    <div className="status-chip info">{goodsIn.length} bays</div>
                  </div>
                  <div className="bay-cards">
                    {goodsIn.map(b => (
                      <div key={b.id} className="bay-card-anim">
                        <BayCard bay={b} onEdit={(bay)=>{ setEditing(bay); setModalOpen(true); }} onDelete={async(id)=>{ const ok = await deleteBay(id); if (ok) notify.success('Bay deleted'); else notify.error('Delete failed'); await reload(); }} onChanged={reload} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bay-lane">
                  <div className="bay-lane-header">
                    <div>
                      <div className="bay-lane-title">Goods Out</div>
                      <div className="bay-lane-subtitle">Outbound docks</div>
                    </div>
                    <div className="status-chip success">{goodsOut.length} bays</div>
                  </div>
                  <div className="bay-cards">
                    {goodsOut.map(b => (
                      <div key={b.id} className="bay-card-anim">
                        <BayCard bay={b} onEdit={(bay)=>{ setEditing(bay); setModalOpen(true); }} onDelete={async(id)=>{ const ok = await deleteBay(id); if (ok) notify.success('Bay deleted'); else notify.error('Delete failed'); await reload(); }} onChanged={reload} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {parking.length > 0 && (
                <div className="parking-row">
                  <div className="parking-title">Overflow Parking <span className="status-chip warn">{parking.length} bays</span></div>
                  <div style={{display:'grid', gap:12, gridTemplateColumns: scale==='lg' ? 'repeat(auto-fill,minmax(360px,1fr))' : scale==='md' ? 'repeat(auto-fill,minmax(300px,1fr))' : 'repeat(auto-fill,minmax(240px,1fr))'}}>
                    {parking.map(b => (
                      <div key={b.id} className="bay-card-anim">
                        <BayCard bay={b} onEdit={(bay)=>{ setEditing(bay); setModalOpen(true); }} onDelete={async(id)=>{ const ok = await deleteBay(id); if (ok) notify.success('Bay deleted'); else notify.error('Delete failed'); await reload(); }} onChanged={reload} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
      </TableCard>

      {modalOpen && (
        <BayFormModal
          warehouses={warehouses}
          initial={editing ?? { warehouse_id: selectedWh || '' } as any}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          onSave={async(values) => { try { if (editing) { await updateBay(editing.id, values); notify.success('Bay updated'); } else { await createBay(values); notify.success('Bay created'); } } catch { notify.error('Save failed'); } finally { setModalOpen(false); setEditing(null); reload(); } }}
        />
      )}
    </div>
  );
};

const BayCard: React.FC<{ bay: Bay; onEdit?: (bay: Bay)=>void; onDelete?: (id: string)=>void; onChanged?: ()=>void }> = ({ bay, onEdit, onDelete, onChanged }) => {
  const isPresent = bay.status === 'VEHICLE_PRESENT';
  const isReserved = bay.status === 'RESERVED';
  const isMaint = bay.status === 'MAINTENANCE';
  const color = isMaint ? 'var(--color-error)' : isPresent ? 'var(--color-primary)' : isReserved ? 'var(--color-info)' : 'var(--color-text-soft)';
  const bg = isMaint
    ? 'color-mix(in srgb, var(--color-error) 8%, transparent)'
    : isPresent
      ? 'var(--color-primary-soft)'
      : isReserved
        ? 'color-mix(in srgb, var(--color-info) 12%, transparent)'
        : 'var(--color-surface-alt)';
  const progress = bay.progressPct ?? 0;

  return (
    <div className="inbound-card" style={{borderColor:color}}>
      <div className="inbound-card-header" style={{background:bg}}>
        <h4 className="inbound-card-title" style={{margin:0, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
          {bay.name} <span style={{fontWeight:500, color:'var(--color-text-soft)'}}>({bay.id})</span>
          <span className="pill-mini" title="Type">{bay.type === 'DYNAMIC' ? `DYN:${bay.dynamicMode}` : bay.type.replace('_',' ')}</span>
          <span className={`status-dot status-dot--${bay.status.toLowerCase()}`} title={bay.status}></span>
        </h4>
        <div className="inline-actions" style={{gap:6}}>
          <button className="icon-button icon-button--edit" title="Edit" onClick={()=>onEdit?.(bay)}><Edit size={16} /></button>
          <button className="icon-button icon-button--delete" title="Delete" onClick={()=>{ if (onDelete) onDelete(bay.id); }}><Trash size={16} /></button>
        </div>
      </div>
      <div className="inbound-card-content" style={{display:'grid', gap:10}}>
        {isPresent && bay.vehicle && (
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <Truck />
            <div>
              <div style={{fontWeight:700}}>{bay.vehicle.reg} • {bay.vehicle.type}</div>
              <div style={{fontSize:12, color:'var(--color-text-soft)'}}>{bay.vehicle.carrier || '—'} {bay.vehicle.vendor ? `• ${bay.vehicle.vendor}` : ''}</div>
            </div>
          </div>
        )}
        {isReserved && bay.reserved_for && (
          <div style={{fontSize:12, color:'var(--color-text-soft)'}}>Reserved for {bay.reserved_for.direction === 'IN' ? 'Inbound' : 'Outbound'} {bay.reserved_for.ref} {bay.reserved_for.eta ? `• ETA ${new Date(bay.reserved_for.eta).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : ''}</div>
        )}
        {isPresent && bay.operation && (
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span className="status-chip">{bay.operation}</span>
            <div style={{flex:1, height:8, background:'var(--color-surface-alt)', borderRadius:8, overflow:'hidden'}}>
              <div style={{width:`${progress}%`, height:'100%', background:'var(--color-primary)', transition:'width .4s ease'}} />
            </div>
            <div style={{width:38, textAlign:'right', fontSize:12}}>{progress}%</div>
          </div>
        )}
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <span className="status-chip">Cap: {bay.capacity}</span>
          <span className="status-chip">Compat: {bay.vehicleCompat.join(', ')}</span>
          <span className="status-chip">Util: {bay.utilizationPct ?? 0}%</span>
        </div>
      </div>
      <div className="inbound-card-footer" style={{padding:'10px 12px', borderTop:'1px solid var(--color-border)'}}>
        <div className="bay-actionbar">
          <button className="icon-button icon-button--maint" title={isMaint ? 'Mark Active' : 'Maintenance'} onClick={async()=>{ await toggleMaintenance(bay.id); notify.success(isMaint ? 'Marked Active' : 'Marked Maintenance'); onChanged?.(); }}>
            <Wrench size={16} />
          </button>
          {bay.type === 'DYNAMIC' && (
            <button className="icon-button icon-button--switch" title={bay.dynamicMode === 'GOODS_IN' ? 'Switch to Out' : 'Switch to In'} onClick={async()=>{ await switchDynamicType(bay.id); notify.success('Switched Mode'); onChanged?.(); }}>
              <Square size={16} />
            </button>
          )}
          {isPresent ? (
            <button className="icon-button icon-button--release" title="Release" onClick={async()=>{ await releaseBay(bay.id); notify.success('Bay released'); onChanged?.(); }}>
              <SquareDot size={16} />
            </button>
          ) : isReserved ? (
            <button className="icon-button icon-button--arrive" title="Mark Arrived" onClick={async()=>{ await assignBay(bay.id, { direction:'IN', ref: bay.reserved_for?.ref || 'RCPT-NEW' }); notify.success('Vehicle arrived'); onChanged?.(); }}>
              <Clock size={16} />
            </button>
          ) : (
            <button className="icon-button icon-button--assign" title="Assign" onClick={async()=>{ await assignBay(bay.id, { direction:'IN', ref: 'RCPT-NEW' }); notify.success('Bay reserved'); onChanged?.(); }}>
              <ActivitySquare size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BayManagement;
