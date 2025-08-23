import React, { useEffect, useMemo, useState } from 'react';
import TableCard from '../../../components/table/TableCard';
import KpiCard from '../../../components/KpiCard';
import EmptyState from '../../../components/EmptyState';
import { PlusCircle, Edit, Trash2, Truck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import * as notify from '../../../lib/notify';
import LoadingOverlay from '../../../components/LoadingOverlay';
import * as vehicleService from '../../../services/vehicleService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWarehouseSelection } from '../../../hooks/useWarehouseSelection';

const STATUSES = ['AVAILABLE','IN_SERVICE','MAINTENANCE'] as const;
const VEHICLE_TYPES = ['VAN_S','TRUCK_M','TRUCK_L'] as const;
const schema = z.object({
  reg_no: z.string().min(3, 'Registration is required'),
  type: z.enum(VEHICLE_TYPES),
  capacity_totes: z.number({ invalid_type_error: 'Must be a number' }).min(1),
  status: z.enum(STATUSES),
  carrier: z.string().optional().nullable(),
});

type Schema = z.infer<typeof schema>;

type Vehicle = vehicleService.Vehicle;

const Vehicles: React.FC = () => {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | vehicleService.VehicleStatus>('');
  const [sortBy, setSortBy] = useState<'reg_no'|'type'|'capacity_totes'>('reg_no');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { warehouses, warehouseId, setWarehouseId, allowSelection } = useWarehouseSelection();
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await vehicleService.listVehicles(warehouseId ? { warehouse_id: warehouseId } : undefined);
        if (mounted) setRows(data);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [warehouseId]);

  const filtered = useMemo(()=>{
    const t = q.trim().toLowerCase();
    const arr = rows.filter(r=>{
  const matches = !t || r.reg_no.toLowerCase().includes(t) || String(r.type).toLowerCase().includes(t) || String(r.capacity_totes ?? '').includes(t) || (r.carrier||'').toLowerCase().includes(t);
      const s = !status || r.status===status;
      return matches && s;
    });
    const dir = sortDir==='asc'?1:-1;
    return arr.sort((a,b)=>{
  const av = sortBy==='capacity_totes'? (a.capacity_totes ?? 0) : String((a as any)[sortBy]).toLowerCase();
  const bv = sortBy==='capacity_totes'? (b.capacity_totes ?? 0) : String((b as any)[sortBy]).toLowerCase();
      if (typeof av === 'number' && typeof bv === 'number') return (av-bv)*dir;
      return String(av).localeCompare(String(bv))*dir;
    });
  },[rows,q,status,sortBy,sortDir]);

  const total = filtered.length;
  const availableCount = filtered.filter(f => f.status === 'AVAILABLE').length;
  const inServiceCount = filtered.filter(f => f.status === 'IN_SERVICE').length;
  const maintCount = filtered.filter(f => f.status === 'MAINTENANCE').length;
  const paged = useMemo(()=>{ const s=(page-1)*pageSize; return filtered.slice(s,s+pageSize); },[filtered,page,pageSize]);

  const onAdd = () => { setEditing(null); setShowModal(true); };
  const onEdit = (r: Vehicle) => { setEditing(r); setShowModal(true); };
  const onDelete = (id: string) => {
    notify.show('Delete this Vehicle?', { action: { label: 'Delete', onClick: async()=>{ await vehicleService.deleteVehicle(id); setRows(prev=>prev.filter(x=>x.id!==id)); notify.success('Deleted'); }}, cancel:{label:'Cancel', onClick: notify.dismiss} });
  };

  return (
    <div className="page-content">
      <header className="header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div className="header-text">
          <h1>Vehicles</h1>
          <p>Manage fleet vehicles and capacity.</p>
        </div>
      </header>

      <div style={{display:'flex',flexWrap:'wrap',gap:12,marginBottom:12}}>
        <KpiCard icon={<Truck/>} title="Total Vehicles" value={total} variant="indigo" />
        <KpiCard icon={<Truck/>} title="Available" value={availableCount} variant="emerald" />
        <KpiCard icon={<Truck/>} title="In Service" value={inServiceCount} variant="cyan" />
        <KpiCard icon={<Truck/>} title="Maintenance" value={maintCount} variant="orange" />
      </div>

      <TableCard
        variant="inbound"
        controlsWrap="wrap"
        title={<div style={{display:'flex',alignItems:'center',gap:8}}><Truck size={18}/> Vehicle Registry</div>}
        warehouse={allowSelection ? (
          <div className="form-field" style={{minWidth:220}}>
            <label>Warehouse</label>
            <select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        ) : undefined}
        search={
          <div className="form-field" style={{maxWidth:360}}>
            <label>Search</label>
            <div style={{position:'relative'}}>
              <Search size={16} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'var(--color-text-subtle)'}}/>
              <input style={{paddingLeft:30}} placeholder="Reg No / Type / Capacity / Carrier" value={q} onChange={e=>{setQ(e.target.value); setPage(1);}}/>
            </div>
          </div>
  }
  actions={<button className="btn-primary-token" onClick={onAdd}><PlusCircle className="icon"/> Add Vehicle</button>}
        filters={
          <>
            <div className="form-field" style={{minWidth:160}}>
              <label>Status</label>
              <select value={status} onChange={e=>{setStatus(e.target.value as any); setPage(1);}}>
                <option value="">All</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </>
        }
        footer={
          <>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{`Showing ${total ? Math.min(total, (page-1)*pageSize+1) : 0}-${total ? Math.min(page*pageSize, total) : 0} of ${total}`}</span>
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className="pager-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page<=1} aria-label="Previous page" title="Previous"><ChevronLeft size={16}/></button>
              <span style={{ minWidth: 32, textAlign: 'center', fontSize: 12 }}>{page}</span>
              <button type="button" className="pager-btn" onClick={() => setPage(p => (p*pageSize<total ? p + 1 : p))} disabled={page*pageSize>=total} aria-label="Next page" title="Next"><ChevronRight size={16}/></button>
            </div>
          </>
        }
      >
        <table className="inbound-table">
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Type</th>
              <th>Capacity (totes)</th>
              <th>Carrier</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><LoadingOverlay label="Loading vehicles" /></td></tr>
            ) : !loading && paged.length===0 ? (
              <tr><td colSpan={6}><EmptyState icon={<Truck/>} title="No Vehicles" message="Add your first vehicle." actionLabel="Add Vehicle" onAction={onAdd}/></td></tr>
            ) : paged.map(r=> (
              <tr key={r.id}>
                <td style={{fontFamily:'ui-monospace,Menlo,monospace'}}>{r.reg_no}</td>
                <td>{r.type}</td>
                <td>{r.capacity_totes ?? '—'}</td>
                <td>{r.carrier || '—'}</td>
                <td><span className={`status-badge status-${(r.status||'ACTIVE').toLowerCase()}`}><span className="status-dot"/> {r.status}</span></td>
                <td className="text-right">
                  <button className="action-link" onClick={()=>onEdit(r)}><Edit size={16}/> Edit</button>
                  <button className="action-link danger" onClick={()=>onDelete(r.id)}><Trash2 size={16}/> Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {showModal && (
        <VehicleModal
          key={editing?.id||'new'}
          initial={editing}
          onClose={()=>setShowModal(false)}
          onSave={async (data)=>{
            try {
              if (editing) {
                const updated = await vehicleService.updateVehicle(editing.id, data as vehicleService.VehicleUpdate);
                setRows(prev=> prev.map(x=> x.id===editing.id ? updated : x));
                notify.success('Vehicle updated');
              } else {
                const created = await vehicleService.createVehicle({ ...data, capacity_totes: Number((data as any).capacity_totes) } as any);
                setRows(prev=> [...prev, created]);
                notify.success('Vehicle created');
              }
              setShowModal(false);
            } catch (e:any) {
              notify.error(e?.response?.data?.detail || 'Failed to save');
            }
          }}
        />
      )}
    </div>
  );
};

const VehicleModal: React.FC<{ initial: Vehicle | null; onClose: ()=>void; onSave: (d: Schema)=>void }> = ({ initial, onClose, onSave }) => {
  const isEdit = !!initial;
  const { register, handleSubmit, formState:{errors} } = useForm<Schema>({
    resolver: zodResolver(schema),
  defaultValues: initial ? {
      reg_no: initial.reg_no,
      type: initial.type,
      capacity_totes: initial.capacity_totes ?? 1000,
      status: (initial.status as any) || 'AVAILABLE',
      carrier: initial.carrier || '',
    } : { reg_no:'', type: 'VAN_S', capacity_totes: 1000, status:'AVAILABLE', carrier:'' as any }
  });
  return (
    <div className="inbound-modal-overlay" onClick={onClose}>
      <div className="inbound-modal" onClick={e=>e.stopPropagation()}>
        <div className="inbound-modal-header">
          <h2 className="inbound-modal-title">{isEdit? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <button className="btn-outline-token" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={handleSubmit(onSave)}>
          <div className="inbound-modal-body">
            <div className="form-row">
              <div className="form-field"><label>Reg No</label><input {...register('reg_no')} className={errors.reg_no?'error':''}/>{errors.reg_no && <div className="error-text">{String(errors.reg_no.message)}</div>}</div>
              <div className="form-field"><label>Type</label><select {...register('type' as any)}>{VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
              <div className="form-field"><label>Capacity (totes)</label><input type="number" step="1" {...register('capacity_totes', { valueAsNumber: true })} className={errors.capacity_totes?'error':''}/>{errors.capacity_totes && <div className="error-text">{String(errors.capacity_totes.message)}</div>}</div>
              <div className="form-field"><label>Status</label><select {...register('status' as any)}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="form-field"><label>Carrier</label><input {...register('carrier')} /></div>
            </div>
          </div>
          <div className="inbound-modal-footer" style={{justifyContent:'space-between'}}>
            <div />
            <div style={{display:'flex',gap:8}}>
              <button type="button" className="btn-outline-token" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary-token">{isEdit?'Save':'Create'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Vehicles;
